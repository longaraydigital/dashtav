import { prisma } from "@/lib/prisma"
import { createGoogleClient } from "./client"
import { mapGoogleMetricRows } from "./mapper"
import { calcDailyMetrics } from "@/services/metrics/calculator"
import type { SyncResult } from "@/types"
import { format, subDays } from "date-fns"
import type { CampaignStatus, ObjectiveType } from "@prisma/client"

// ─────────────────────────────────────────
// Mapeamento de status Google → interno
// ─────────────────────────────────────────

function mapStatus(googleStatus: string): CampaignStatus {
  switch (googleStatus) {
    case "ENABLED": return "ACTIVE"
    case "PAUSED":  return "PAUSED"
    case "REMOVED": return "ENDED"
    default:        return "PAUSED"
  }
}

// Google não tem um "objetivo" equivalente ao Meta — mapeamos pelo channel type
function mapChannelType(channelType: string): ObjectiveType {
  // Lead form campaigns são raras no Google; por padrão tudo é SALES
  // O usuário pode ajustar manualmente via banco/UI
  return "SALES"
}

// ─────────────────────────────────────────
// Sync principal
// ─────────────────────────────────────────

/**
 * Sincroniza os últimos N dias de dados do Google Ads.
 *
 * Fluxo:
 * 1. Importa campanhas da conta Google → upsert no banco pelo externalId
 * 2. Busca métricas diárias do período via GAQL
 * 3. Upsert de DailyMetric por [date, campaignId]
 */
export async function syncGoogle(daysBack = 7): Promise<SyncResult> {
  const dateTo   = format(new Date(), "yyyy-MM-dd")
  const dateFrom = format(subDays(new Date(), daysBack), "yyyy-MM-dd")

  const log = await prisma.syncLog.create({
    data: { platform: "GOOGLE", status: "RUNNING" },
  })

  try {
    const client = createGoogleClient()

    // ── Etapa 1: importar / atualizar campanhas Google no banco
    const googleCampaigns = await client.getCampaigns()

    for (const gc of googleCampaigns) {
      const c           = gc.campaign
      const status      = mapStatus(c.status)
      const objectiveType = mapChannelType(c.advertisingChannelType)
      const startDate   = c.startDate ? new Date(c.startDate) : new Date()
      const endDate     = c.endDate   ? new Date(c.endDate)   : null

      const existing = await prisma.campaign.findFirst({
        where: { externalId: c.id, platform: "GOOGLE" },
        select: { id: true },
      })

      if (existing) {
        await prisma.campaign.update({
          where: { id: existing.id },
          data:  { name: c.name, status, endDate },
        })
      } else {
        await prisma.campaign.create({
          data: {
            name: c.name,
            platform: "GOOGLE",
            objectiveType,
            status,
            startDate,
            endDate,
            externalId: c.id,
          },
        })
      }
    }

    // ── Etapa 2: buscar métricas diárias
    const rows    = await client.getDailyMetrics(dateFrom, dateTo)
    const metrics = mapGoogleMetricRows(rows)

    const externalIds = [...new Set(metrics.map((m) => m.externalCampaignId))]
    const campaigns   = await prisma.campaign.findMany({
      where: { externalId: { in: externalIds }, platform: "GOOGLE" },
      select: { id: true, externalId: true, objectiveType: true },
    })

    const externalToInternal = new Map(campaigns.map((c) => [c.externalId!, c]))

    // ── Etapa 3: upsert DailyMetric
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
          date:        metric.date,
          campaignId:  campaign.id,
          platform:    "GOOGLE",
          impressions: metric.impressions,
          clicks:      metric.clicks,
          cost:        metric.cost,
          leads:       isSales ? 0 : metric.conversions,
          sales:       isSales ? metric.conversions : 0,
          revenue:     metric.revenue,
          ...computed,
        },
        update: {
          impressions: metric.impressions,
          clicks:      metric.clicks,
          cost:        metric.cost,
          leads:       isSales ? 0 : metric.conversions,
          sales:       isSales ? metric.conversions : 0,
          revenue:     metric.revenue,
          ...computed,
        },
      })

      processed++
    }

    await Promise.all([
      prisma.integration.upsert({
        where:  { platform: "GOOGLE" },
        create: { platform: "GOOGLE", status: "ACTIVE", lastSync: new Date() },
        update: { status: "ACTIVE", lastSync: new Date() },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status:  "SUCCESS",
          records: processed,
          message: `${googleCampaigns.length} campanhas importadas · ${processed} métricas sincronizadas`,
        },
      }),
    ])

    return { platform: "GOOGLE", status: "SUCCESS", recordsProcessed: processed }
  } catch (error: any) {
    const message = error?.message ?? "Erro desconhecido"

    await Promise.all([
      prisma.integration.upsert({
        where:  { platform: "GOOGLE" },
        create: { platform: "GOOGLE", status: "ERROR" },
        update: { status: "ERROR" },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data:  { status: "ERROR", message },
      }),
    ])

    return { platform: "GOOGLE", status: "ERROR", recordsProcessed: 0, error: message }
  }
}
