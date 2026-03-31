import type { GoogleMetricRow } from "./client"
import type { NormalizedCampaignMetric } from "@/types"

const MICROS = 1_000_000

/**
 * Normaliza uma linha de métricas do Google Ads para o formato interno.
 * cost_micros → BRL (divide por 1.000.000)
 */
export function mapGoogleMetricRow(row: GoogleMetricRow): NormalizedCampaignMetric {
  const cost    = Number(row.metrics.costMicros) / MICROS
  const sales   = Number(row.metrics.conversions) || 0
  const revenue = Number(row.metrics.conversionsValue) || 0

  return {
    externalCampaignId: row.campaign.id,
    platform: "GOOGLE",
    date: new Date(row.segments.date),
    impressions: Number(row.metrics.impressions) || 0,
    clicks: Number(row.metrics.clicks) || 0,
    cost,
    leads: 0,   // Google retorna "conversões" — leads vêm do tipo de conversão configurado
    conversions: sales,
    revenue,
  }
}

export function mapGoogleMetricRows(rows: GoogleMetricRow[]): NormalizedCampaignMetric[] {
  return rows.map(mapGoogleMetricRow)
}
