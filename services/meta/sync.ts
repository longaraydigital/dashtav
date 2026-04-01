import { prisma } from "@/lib/prisma"
import { createMetaClient } from "./client"
import { mapMetaInsights } from "./mapper"
import { calcDailyMetrics } from "@/services/metrics/calculator"
import type { SyncResult } from "@/types"
import { format, subDays } from "date-fns"
import type { CampaignStatus, ObjectiveType } from "@prisma/client"

// ─────────────────────────────────────────
// Mapeamento de objetivos Meta → interno
// ─────────────────────────────────────────

const LEADS_OBJECTIVES = new Set([
  "OUTCOME_LEADS",
  "LEAD_GENERATION",
])

const SALES_OBJECTIVES = new Set([
  "OUTCOME_SALES",
  "CONVERSIONS",
  "PRODUCT_CATALOG_SALES",
  "OUTCOME_ENGAGEMENT", // frequentemente usado para vendas diretas
])

function mapObjective(metaObjective: string): ObjectiveType {
  if (LEADS_OBJECTIVES.has(metaObjective)) return "LEADS"
  return "SALES" // default — inclui SALES e qualquer outro
}

function mapStatus(metaStatus: string): CampaignStatus {
  switch (metaStatus) {
    case "ACTIVE":   return "ACTIVE"
    case "PAUSED":   return "PAUSED"
    case "DELETED":  return "ENDED"
    case "ARCHIVED": return "ENDED"
    default:         return "PAUSED"
  }
}

// ─────────────────────────────────────────
// Sync principal
// ─────────────────────────────────────────

/**
 * Sincroniza os últimos N dias de dados da Meta Ads.
 *
 * Fluxo:
 * 1. Importa campanhas da conta Meta → upsert no banco pelo externalId
 * 2. Busca insights diários do período
 * 3. Upsert de DailyMetric por [date, campaignId]
 */
export async function syncMeta(daysBack = 7): Promise<SyncResult> {
  const dateTo   = format(new Date(), "yyyy-MM-dd")
  const dateFrom = format(subDays(new Date(), daysBack), "yyyy-MM-dd")

  const log = await prisma.syncLog.create({
    data: { platform: "META", status: "RUNNING" },
  })

  try {
    const client = createMetaClient()

    // ── Etapa 1: importar / atualizar campanhas Meta no banco
    const metaCampaigns = await client.getCampaigns()

    for (const mc of metaCampaigns) {
      const objectiveType = mapObjective(mc.objective)
      const status        = mapStatus(mc.status)
      const startDate     = mc.start_time ? new Date(mc.start_time) : new Date()
      const endDate       = mc.stop_time  ? new Date(mc.stop_time)  : null

      const existing = await prisma.campaign.findFirst({
        where: { externalId: mc.id, platform: "META" },
        select: { id: true },
      })

      if (existing) {
        await prisma.campaign.update({
          where: { id: existing.id },
          data:  { name: mc.name, status, endDate },
        })
      } else {
        await prisma.campaign.create({
          data: {
            name: mc.name,
            platform: "META",
            objectiveType,
            status,
            startDate,
            endDate,
            externalId: mc.id,
          },
        })
      }
    }

    // ── Etapa 2: buscar e mapear insights diários
    const insights = await client.getDailyInsights(dateFrom, dateTo)
    const metrics  = mapMetaInsights(insights)

    // Busca campanhas do banco para mapear externalId → id interno
    const externalIds = [...new Set(metrics.map((m) => m.externalCampaignId))]
    const campaigns   = await prisma.campaign.findMany({
      where: { externalId: { in: externalIds }, platform: "META" },
      select: { id: true, externalId: true, objectiveType: true },
    })

    const externalToInternal = new Map(
      campaigns.map((c) => [c.externalId!, c])
    )

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
        metric.leads,
        isSales ? metric.conversions : 0,
        metric.revenue
      )

      await prisma.dailyMetric.upsert({
        where: { date_campaignId: { date: metric.date, campaignId: campaign.id } },
        create: {
          date:        metric.date,
          campaignId:  campaign.id,
          platform:    "META",
          impressions: metric.impressions,
          clicks:      metric.clicks,
          cost:        metric.cost,
          leads:       metric.leads,
          sales:       isSales ? metric.conversions : 0,
          revenue:     metric.revenue,
          ...computed,
        },
        update: {
          impressions: metric.impressions,
          clicks:      metric.clicks,
          cost:        metric.cost,
          leads:       metric.leads,
          sales:       isSales ? metric.conversions : 0,
          revenue:     metric.revenue,
          ...computed,
        },
      })

      processed++
    }

    // ── Atualiza integration + log
    await Promise.all([
      prisma.integration.upsert({
        where:  { platform: "META" },
        create: { platform: "META", status: "ACTIVE", lastSync: new Date() },
        update: { status: "ACTIVE", lastSync: new Date() },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status:  "SUCCESS",
          records: processed,
          message: `${metaCampaigns.length} campanhas importadas · ${processed} métricas sincronizadas`,
        },
      }),
    ])

    return { platform: "META", status: "SUCCESS", recordsProcessed: processed }
  } catch (error: any) {
    const message = error?.message ?? "Erro desconhecido"

    await Promise.all([
      prisma.integration.upsert({
        where:  { platform: "META" },
        create: { platform: "META", status: "ERROR" },
        update: { status: "ERROR" },
      }),
      prisma.syncLog.update({
        where: { id: log.id },
        data:  { status: "ERROR", message },
      }),
    ])

    return { platform: "META", status: "ERROR", recordsProcessed: 0, error: message }
  }
}
