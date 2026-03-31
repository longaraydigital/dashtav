import { prisma } from "@/lib/prisma"
import { createMetaClient } from "./client"
import { mapMetaInsights } from "./mapper"
import { calcDailyMetrics } from "@/services/metrics/calculator"
import type { SyncResult } from "@/types"
import { format, subDays } from "date-fns"

/**
 * Sincroniza os últimos N dias de dados da Meta Ads.
 * Usa upsert pelo unique [date, campaignId] — histórico nunca é sobrescrito,
 * apenas o dia atual é atualizado.
 */
export async function syncMeta(daysBack = 7): Promise<SyncResult> {
  const dateTo   = format(new Date(), "yyyy-MM-dd")
  const dateFrom = format(subDays(new Date(), daysBack), "yyyy-MM-dd")

  // Registra início do sync
  const log = await prisma.syncLog.create({
    data: { platform: "META", status: "RUNNING" },
  })

  try {
    const client   = createMetaClient()
    const insights = await client.getDailyInsights(dateFrom, dateTo)
    const metrics  = mapMetaInsights(insights)

    // Busca campanhas pelo externalId para mapear → id interno
    const externalIds = [...new Set(metrics.map((m) => m.externalCampaignId))]
    const campaigns   = await prisma.campaign.findMany({
      where: { externalId: { in: externalIds }, platform: "META" },
      select: { id: true, externalId: true, objectiveType: true },
    })

    const externalToInternal = new Map(
      campaigns.map((c) => [c.externalId!, c])
    )

    let processed = 0

    for (const metric of metrics) {
      const campaign = externalToInternal.get(metric.externalCampaignId)
      if (!campaign) continue // Campanha não cadastrada no DASH TAV — ignorar

      const isSales = campaign.objectiveType === "SALES"

      const computed = calcDailyMetrics(
        metric.impressions,
        metric.clicks,
        metric.cost,
        metric.leads,
        isSales ? metric.conversions : 0,
        metric.revenue
      )

      await prisma.dailyMetric.upsert({
        where: { date_campaignId: { date: metric.date, campaignId: campaign.id } },
        create: {
          date: metric.date,
          campaignId: campaign.id,
          platform: "META",
          impressions: metric.impressions,
          clicks: metric.clicks,
          cost: metric.cost,
          leads: metric.leads,
          sales: isSales ? metric.conversions : 0,
          revenue: metric.revenue,
          ...computed,
        },
        update: {
          impressions: metric.impressions,
          clicks: metric.clicks,
          cost: metric.cost,
          leads: metric.leads,
          sales: isSales ? metric.conversions : 0,
          revenue: metric.revenue,
          ...computed,
        },
      })

      processed++
    }

    // Atualiza integration + log
    await Promise.all([
      prisma.integration.upsert({
        where: { platform: "META" },
        create: { platform: "META", status: "ACTIVE", lastSync: new Date() },
        update: { status: "ACTIVE", lastSync: new Date() },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data: { status: "SUCCESS", records: processed, message: `${processed} registros sincronizados` },
      }),
    ])

    return { platform: "META", status: "SUCCESS", recordsProcessed: processed }
  } catch (error: any) {
    const message = error?.message ?? "Erro desconhecido"

    await Promise.all([
      prisma.integration.upsert({
        where: { platform: "META" },
        create: { platform: "META", status: "ERROR" },
        update: { status: "ERROR" },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data: { status: "ERROR", message },
      }),
    ])

    return { platform: "META", status: "ERROR", recordsProcessed: 0, error: message }
  }
}
