import { prisma } from "@/lib/prisma"
import { createGoogleClient } from "./client"
import { mapGoogleMetricRows } from "./mapper"
import { calcDailyMetrics } from "@/services/metrics/calculator"
import type { SyncResult } from "@/types"
import { format, subDays } from "date-fns"

export async function syncGoogle(daysBack = 7): Promise<SyncResult> {
  const dateTo   = format(new Date(), "yyyy-MM-dd")
  const dateFrom = format(subDays(new Date(), daysBack), "yyyy-MM-dd")

  const log = await prisma.syncLog.create({
    data: { platform: "GOOGLE", status: "RUNNING" },
  })

  try {
    const client  = createGoogleClient()
    const rows    = await client.getDailyMetrics(dateFrom, dateTo)
    const metrics = mapGoogleMetricRows(rows)

    const externalIds = [...new Set(metrics.map((m) => m.externalCampaignId))]
    const campaigns   = await prisma.campaign.findMany({
      where: { externalId: { in: externalIds }, platform: "GOOGLE" },
      select: { id: true, externalId: true, objectiveType: true },
    })

    const externalToInternal = new Map(campaigns.map((c) => [c.externalId!, c]))

    let processed = 0

    for (const metric of metrics) {
      const campaign = externalToInternal.get(metric.externalCampaignId)
      if (!campaign) continue

      const isSales = campaign.objectiveType === "SALES"

      const computed = calcDailyMetrics(
        metric.impressions,
        metric.clicks,
        metric.cost,
        isSales ? 0 : metric.conversions,
        isSales ? metric.conversions : 0,
        metric.revenue
      )

      await prisma.dailyMetric.upsert({
        where: { date_campaignId: { date: metric.date, campaignId: campaign.id } },
        create: {
          date: metric.date,
          campaignId: campaign.id,
          platform: "GOOGLE",
          impressions: metric.impressions,
          clicks: metric.clicks,
          cost: metric.cost,
          leads: isSales ? 0 : metric.conversions,
          sales: isSales ? metric.conversions : 0,
          revenue: metric.revenue,
          ...computed,
        },
        update: {
          impressions: metric.impressions,
          clicks: metric.clicks,
          cost: metric.cost,
          leads: isSales ? 0 : metric.conversions,
          sales: isSales ? metric.conversions : 0,
          revenue: metric.revenue,
          ...computed,
        },
      })

      processed++
    }

    await Promise.all([
      prisma.integration.upsert({
        where: { platform: "GOOGLE" },
        create: { platform: "GOOGLE", status: "ACTIVE", lastSync: new Date() },
        update: { status: "ACTIVE", lastSync: new Date() },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data: { status: "SUCCESS", records: processed, message: `${processed} registros sincronizados` },
      }),
    ])

    return { platform: "GOOGLE", status: "SUCCESS", recordsProcessed: processed }
  } catch (error: any) {
    const message = error?.message ?? "Erro desconhecido"

    await Promise.all([
      prisma.integration.upsert({
        where: { platform: "GOOGLE" },
        create: { platform: "GOOGLE", status: "ERROR" },
        update: { status: "ERROR" },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data: { status: "ERROR", message },
      }),
    ])

    return { platform: "GOOGLE", status: "ERROR", recordsProcessed: 0, error: message }
  }
}
