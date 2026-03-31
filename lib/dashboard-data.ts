import { prisma } from "@/lib/prisma"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { classifySalesPerformance, classifyLeadsPerformance } from "@/services/metrics/classifier"
import type { CampaignRow } from "@/components/campaigns/CampaignTable"
import type { LineChartData, BarChartData, PieChartData } from "@/components/dashboard/Charts"

export interface DashboardKpis {
  totalCost: number
  totalRevenue: number
  totalProfit: number
  roas: number | null
  cpa: number | null
  cpl: number | null
  totalLeads: number
  totalSales: number
}

export interface DashboardData {
  kpis: DashboardKpis
  lineData: LineChartData[]
  pieData: PieChartData[]
  barData: BarChartData[]
  campaignRows: CampaignRow[]
  hasData: boolean
  periodLabel: string
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const last14Start = subDays(today, 13)

  const [monthMetrics, activeCampaigns] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "asc" },
    }),
    prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        product: { include: { leadEconomics: true } },
        targets: true,
      },
    }),
  ])

  // ── KPIs
  const totalCost = monthMetrics.reduce((s, m) => s + Number(m.cost), 0)
  const totalRevenue = monthMetrics.reduce((s, m) => s + Number(m.revenue), 0)
  const totalLeads = monthMetrics.reduce((s, m) => s + m.leads, 0)
  const totalSales = monthMetrics.reduce((s, m) => s + m.sales, 0)
  const totalProfit = totalRevenue - totalCost
  const roas = totalCost > 0 ? totalRevenue / totalCost : null
  const cpa = totalSales > 0 ? totalCost / totalSales : null
  const cpl = totalLeads > 0 ? totalCost / totalLeads : null

  // ── Gráfico de linha: últimos 14 dias agrupados por data
  const last14Metrics = monthMetrics.filter(
    (m) => new Date(m.date) >= last14Start
  )
  const byDate = new Map<string, { custo: number; faturamento: number }>()
  for (const m of last14Metrics) {
    const key = format(new Date(m.date), "dd/MM")
    const existing = byDate.get(key) ?? { custo: 0, faturamento: 0 }
    byDate.set(key, {
      custo: existing.custo + Number(m.cost),
      faturamento: existing.faturamento + Number(m.revenue),
    })
  }
  const lineData: LineChartData[] = Array.from(byDate.entries()).map(
    ([date, v]) => ({ date, ...v })
  )

  // ── Gráfico de pizza: custo por plataforma
  const platformCosts = new Map<string, number>()
  for (const m of monthMetrics) {
    platformCosts.set(
      m.platform,
      (platformCosts.get(m.platform) ?? 0) + Number(m.cost)
    )
  }
  const pieData: PieChartData[] = Array.from(platformCosts.entries()).map(
    ([platform, value]) => ({
      name: platform === "META" ? "Meta" : "Google",
      value,
    })
  )

  // ── Gráfico de barra: CPA por campanha SALES
  const campaignAgg = new Map<
    string,
    { cost: number; revenue: number; leads: number; sales: number }
  >()
  for (const m of monthMetrics) {
    const existing = campaignAgg.get(m.campaignId) ?? {
      cost: 0,
      revenue: 0,
      leads: 0,
      sales: 0,
    }
    campaignAgg.set(m.campaignId, {
      cost: existing.cost + Number(m.cost),
      revenue: existing.revenue + Number(m.revenue),
      leads: existing.leads + m.leads,
      sales: existing.sales + m.sales,
    })
  }

  const barData: BarChartData[] = activeCampaigns
    .filter((c) => c.objectiveType === "SALES")
    .map((c) => {
      const agg = campaignAgg.get(c.id)
      if (!agg || agg.sales === 0) return null
      const cpaVal = Math.round(agg.cost / agg.sales)
      const label =
        c.name.length > 22 ? c.name.substring(0, 22) + "…" : c.name
      const meta = c.targets?.cpaTarget ? Number(c.targets.cpaTarget) : 0
      return { name: label, cpa: cpaVal, meta }
    })
    .filter(Boolean)
    .sort((a, b) => a!.cpa - b!.cpa)
    .slice(0, 6) as BarChartData[]

  // ── Tabela de campanhas ativas
  const campaignRows: CampaignRow[] = activeCampaigns.map((c) => {
    const agg = campaignAgg.get(c.id) ?? {
      cost: 0,
      revenue: 0,
      leads: 0,
      sales: 0,
    }
    const cpaVal = agg.sales > 0 ? agg.cost / agg.sales : null
    const cplVal = agg.leads > 0 ? agg.cost / agg.leads : null
    const roasVal = agg.cost > 0 ? agg.revenue / agg.cost : null
    const profitVal =
      agg.cost > 0 || agg.revenue > 0 ? agg.revenue - agg.cost : null

    // Normaliza Decimals do produto
    const product = c.product
      ? {
          ...c.product,
          ticket: Number(c.product.ticket),
          marginPercent: Number(c.product.marginPercent),
          desiredProfitPercent: Number(c.product.desiredProfitPercent),
          breakEvenCpa: c.product.breakEvenCpa
            ? Number(c.product.breakEvenCpa)
            : null,
          idealCpa: c.product.idealCpa ? Number(c.product.idealCpa) : null,
          leadEconomics: c.product.leadEconomics
            ? {
                ...c.product.leadEconomics,
                leadToSaleRate: Number(
                  c.product.leadEconomics.leadToSaleRate
                ),
                idealCpl: c.product.leadEconomics.idealCpl
                  ? Number(c.product.leadEconomics.idealCpl)
                  : null,
                breakEvenCpl: c.product.leadEconomics.breakEvenCpl
                  ? Number(c.product.leadEconomics.breakEvenCpl)
                  : null,
              }
            : null,
        }
      : null

    let performanceStatus: CampaignRow["performanceStatus"] = "NO_DATA"
    if (c.objectiveType === "SALES") {
      const perf = classifySalesPerformance(
        cpaVal,
        product?.idealCpa ?? null,
        product?.breakEvenCpa ?? null
      )
      performanceStatus = perf.status
    } else {
      const perf = classifyLeadsPerformance(
        cplVal,
        product?.leadEconomics?.idealCpl ?? null,
        product?.leadEconomics?.breakEvenCpl ?? null
      )
      performanceStatus = perf.status
    }

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      objectiveType: c.objectiveType,
      cost: agg.cost,
      leads: agg.leads,
      sales: agg.sales,
      cpa: cpaVal,
      cpl: cplVal,
      roas: roasVal,
      profit: profitVal,
      performanceStatus,
    }
  })

  const monthName = format(today, "MMMM yyyy", {
    locale: await import("date-fns/locale/pt-BR").then((m) => m.ptBR),
  })

  return {
    kpis: { totalCost, totalRevenue, totalProfit, roas, cpa, cpl, totalLeads, totalSales },
    lineData,
    pieData,
    barData,
    campaignRows,
    hasData: monthMetrics.length > 0,
    periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
  }
}
