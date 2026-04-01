import { prisma } from "@/lib/prisma"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { classifySalesPerformance } from "@/services/metrics/classifier"
import type { CampaignRow } from "@/components/campaigns/CampaignTable"
import type { LineChartData, BarChartData } from "@/components/dashboard/Charts"

export interface SalesKpis {
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgCpa: number | null
  avgRoas: number | null
  activeCampaigns: number
}

export interface SalesPageData {
  kpis: SalesKpis
  lineData: LineChartData[]
  barData: BarChartData[]
  campaignRows: CampaignRow[]
  hasData: boolean
  periodLabel: string
}

export async function getSalesData(): Promise<SalesPageData> {
  const today      = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd   = endOfMonth(today)
  const last14     = subDays(today, 13)

  const campaigns = await prisma.campaign.findMany({
    where: { objectiveType: "SALES" },
    include: {
      product: { include: { leadEconomics: true } },
      targets: true,
    },
    orderBy: { name: "asc" },
  })

  const monthMetrics = await prisma.dailyMetric.findMany({
    where: {
      campaignId: { in: campaigns.map((c) => c.id) },
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { date: "asc" },
  })

  // ── Agregar por campanha
  const campaignAgg = new Map<string, { cost: number; revenue: number; leads: number; sales: number }>()
  for (const m of monthMetrics) {
    const ex = campaignAgg.get(m.campaignId) ?? { cost: 0, revenue: 0, leads: 0, sales: 0 }
    campaignAgg.set(m.campaignId, {
      cost:    ex.cost    + Number(m.cost),
      revenue: ex.revenue + Number(m.revenue),
      leads:   ex.leads   + m.leads,
      sales:   ex.sales   + m.sales,
    })
  }

  // ── KPIs globais
  const totalCost    = monthMetrics.reduce((s, m) => s + Number(m.cost), 0)
  const totalRevenue = monthMetrics.reduce((s, m) => s + Number(m.revenue), 0)
  const totalSales   = monthMetrics.reduce((s, m) => s + m.sales, 0)
  const totalProfit  = totalRevenue - totalCost
  const avgCpa  = totalSales > 0 ? totalCost  / totalSales  : null
  const avgRoas = totalCost  > 0 ? totalRevenue / totalCost : null
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length

  // ── Gráfico de linha: custo vs faturamento (últimos 14 dias)
  const last14Metrics = monthMetrics.filter((m) => new Date(m.date) >= last14)
  const byDate = new Map<string, { custo: number; faturamento: number }>()
  for (const m of last14Metrics) {
    const key = format(new Date(m.date), "dd/MM")
    const ex  = byDate.get(key) ?? { custo: 0, faturamento: 0 }
    byDate.set(key, {
      custo:       ex.custo       + Number(m.cost),
      faturamento: ex.faturamento + Number(m.revenue),
    })
  }
  const lineData: LineChartData[] = Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v }))

  // ── Gráfico de barras: CPA por campanha SALES
  const barData: BarChartData[] = campaigns
    .map((c) => {
      const agg = campaignAgg.get(c.id)
      if (!agg || agg.sales === 0) return null
      const label = c.name.length > 22 ? c.name.substring(0, 22) + "…" : c.name
      const meta  = c.targets?.cpaTarget ? Number(c.targets.cpaTarget) : 0
      return { name: label, cpa: Math.round(agg.cost / agg.sales), meta }
    })
    .filter(Boolean)
    .sort((a, b) => a!.cpa - b!.cpa)
    .slice(0, 6) as BarChartData[]

  // ── Tabela de campanhas
  const campaignRows: CampaignRow[] = campaigns.map((c) => {
    const agg    = campaignAgg.get(c.id) ?? { cost: 0, revenue: 0, leads: 0, sales: 0 }
    const cpaVal = agg.sales > 0 ? agg.cost / agg.sales : null
    const roasVal = agg.cost > 0 ? agg.revenue / agg.cost : null
    const profitVal = agg.cost > 0 || agg.revenue > 0 ? agg.revenue - agg.cost : null

    const product = c.product ? {
      ...c.product,
      ticket:               Number(c.product.ticket),
      marginPercent:        Number(c.product.marginPercent),
      desiredProfitPercent: Number(c.product.desiredProfitPercent),
      breakEvenCpa: c.product.breakEvenCpa ? Number(c.product.breakEvenCpa) : null,
      idealCpa:     c.product.idealCpa     ? Number(c.product.idealCpa)     : null,
      leadEconomics: null,
    } : null

    const perf = classifySalesPerformance(
      cpaVal,
      product?.idealCpa    ?? null,
      product?.breakEvenCpa ?? null
    )

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      objectiveType: c.objectiveType,
      cost:  agg.cost,
      leads: agg.leads,
      sales: agg.sales,
      cpa:   cpaVal,
      cpl:   null,
      roas:  roasVal,
      profit: profitVal,
      performanceStatus: perf.status,
    }
  })

  const monthName = format(today, "MMMM yyyy", { locale: ptBR })

  return {
    kpis: { totalSales, totalRevenue, totalCost, totalProfit, avgCpa, avgRoas, activeCampaigns },
    lineData,
    barData,
    campaignRows,
    hasData: monthMetrics.length > 0,
    periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
  }
}
