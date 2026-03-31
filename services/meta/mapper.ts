import type { MetaInsight } from "./client"
import type { NormalizedCampaignMetric } from "@/types"

const LEAD_ACTIONS = ["lead", "offsite_conversion.fb_pixel_lead", "onsite_web_lead"]
const SALE_ACTIONS = ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"]

/**
 * Normaliza um insight diário da Meta para o formato interno do DASH TAV.
 * Separa leads de conversões de venda pelo tipo de action.
 */
export function mapMetaInsight(insight: MetaInsight): NormalizedCampaignMetric {
  const actions = insight.actions ?? []

  const leads = actions
    .filter((a) => LEAD_ACTIONS.includes(a.action_type))
    .reduce((sum, a) => sum + Number(a.value), 0)

  const sales = actions
    .filter((a) => SALE_ACTIONS.includes(a.action_type))
    .reduce((sum, a) => sum + Number(a.value), 0)

  // Meta não retorna revenue diretamente — será enriquecido via checkout/CRM futuramente
  const revenue = 0

  return {
    externalCampaignId: insight.campaign_id,
    platform: "META",
    date: new Date(insight.date_start),
    impressions: Number(insight.impressions) || 0,
    clicks: Number(insight.clicks) || 0,
    cost: Number(insight.spend) || 0,
    leads,
    conversions: sales > 0 ? sales : leads,
    revenue,
  }
}

export function mapMetaInsights(insights: MetaInsight[]): NormalizedCampaignMetric[] {
  return insights.map(mapMetaInsight)
}
