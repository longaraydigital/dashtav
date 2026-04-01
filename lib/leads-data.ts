import { prisma } from "@/lib/prisma"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { classifyLeadsPerformance } from "@/services/metrics/classifier"
import type { CampaignRow } from "@/components/campaigns/CampaignTable"

export interface LeadsKpis {
  totalLeads: number
  totalCost: number
  avgCpl: number | null
  activeCampaigns: number
}

export interface LeadsDayData {
  date: string
  leads: number
  custo: number
}

export interface LeadsPageData {
  kpis: LeadsKpis
  lineData: LeadsDayData[]
  campaignRows: CampaignRow[]
  hasData: boolean
  periodLabel: string
}

export async function getLeadsData(): Promise<LeadsPageData> {
  const today      = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd   = endOfMonth(today)
  const last14     = subDays(today, 13)

  const campaigns = await prisma.campaign.findMany({
    where: { objectiveType: "LEADS" },
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
  const totalLeads = monthMetrics.reduce((s, m) => s + m.leads, 0)
  const totalCost  = monthMetrics.reduce((s, m) => s + Number(m.cost), 0)
  const avgCpl     = totalLeads > 0 ? totalCost / totalLeads : null
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length

  // ── Gráfico de linha: leads + custo por dia (últimos 14 dias)
  const last14Metrics = monthMetrics.filter((m) => new Date(m.date) >= last14)
  const byDate = new Map<string, { leads: number; custo: number }>()
  for (const m of last14Metrics) {
    const key = format(new Date(m.date), "dd/MM")
    const ex  = byDate.get(key) ?? { leads: 0, custo: 0 }
    byDate.set(key, { leads: ex.leads + m.leads, custo: ex.custo + Number(m.cost) })
  }
  const lineData: LeadsDayData[] = Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v }))

  // ── Tabela de campanhas
  const campaignRows: CampaignRow[] = campaigns.map((c) => {
    const agg  = campaignAgg.get(c.id) ?? { cost: 0, revenue: 0, leads: 0, sales: 0 }
    const cplVal  = agg.leads > 0 ? agg.cost / agg.leads : null
    const profitVal = agg.cost > 0 || agg.revenue > 0 ? agg.revenue - agg.cost : null

    const product = c.product ? {
      ...c.product,
      ticket:               Number(c.product.ticket),
      marginPercent:        Number(c.product.marginPercent),
      desiredProfitPercent: Number(c.product.desiredProfitPercent),
      breakEvenCpa: c.product.breakEvenCpa ? Number(c.product.breakEvenCpa) : null,
      idealCpa:     c.product.idealCpa     ? Number(c.product.idealCpa)     : null,
      leadEconomics: c.product.leadEconomics ? {
        ...c.product.leadEconomics,
        leadToSaleRate: Number(c.product.leadEconomics.leadToSaleRate),
        idealCpl:    c.product.leadEconomics.idealCpl    ? Number(c.product.leadEconomics.idealCpl)    : null,
        breakEvenCpl: c.product.leadEconomics.breakEvenCpl ? Number(c.product.leadEconomics.breakEvenCpl) : null,
      } : null,
    } : null

    const perf = classifyLeadsPerformance(
      cplVal,
      product?.leadEconomics?.idealCpl    ?? null,
      product?.leadEconomics?.breakEvenCpl ?? null
    )

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      objectiveType: c.objectiveType,
      cost:   agg.cost,
      leads:  agg.leads,
      sales:  agg.sales,
      cpa:    null,
      cpl:    cplVal,
      roas:   null,
      profit: profitVal,
      performanceStatus: perf.status,
    }
  })

  const monthName = format(today, "MMMM yyyy", { locale: ptBR })

  return {
    kpis: { totalLeads, totalCost, avgCpl, activeCampaigns },
    lineData,
    campaignRows,
    hasData: monthMetrics.length > 0,
    periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
  }
}
