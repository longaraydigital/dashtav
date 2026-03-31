import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"
import { classifySalesPerformance, classifyLeadsPerformance } from "@/services/metrics/classifier"
import type { CampaignRow } from "@/components/campaigns/CampaignTable"
import type { CampaignStatus } from "@prisma/client"

export interface CampaignsPageData {
  rows: CampaignRow[]
  hasData: boolean
}

export async function getCampaignsData(
  statusFilter?: CampaignStatus
): Promise<CampaignsPageData> {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const campaigns = await prisma.campaign.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      product: { include: { leadEconomics: true } },
      targets: true,
    },
    orderBy: { name: "asc" },
  })

  const monthMetrics = await prisma.dailyMetric.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      campaignId: { in: campaigns.map((c) => c.id) },
    },
  })

  // Agregar métricas por campanha
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

  const rows: CampaignRow[] = campaigns.map((c) => {
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

  return {
    rows,
    hasData: rows.length > 0,
  }
}
