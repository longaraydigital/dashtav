/**
 * Meta Ads API Client
 * Docs: https://developers.facebook.com/docs/marketing-api
 */

const META_API_BASE = "https://graph.facebook.com/v21.0"

interface MetaApiOptions {
  accessToken: string
  adAccountId: string  // formato: act_XXXXXXXXX
}

export interface MetaCampaign {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED"
  objective: string
  start_time?: string
  stop_time?: string
}

export interface MetaInsight {
  campaign_id: string
  campaign_name: string
  date_start: string
  date_stop: string
  impressions: string
  clicks: string
  spend: string
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
}

export class MetaAdsClient {
  private accessToken: string
  private adAccountId: string

  constructor(options: MetaApiOptions) {
    this.accessToken = options.accessToken
    this.adAccountId = options.adAccountId
  }

  private async fetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${META_API_BASE}/${path}`)
    url.searchParams.set("access_token", this.accessToken)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }

    const res = await globalThis.fetch(url.toString())
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(`Meta API error ${res.status}: ${JSON.stringify(error)}`)
    }
    return res.json() as Promise<T>
  }

  /** Lista campanhas ativas da conta */
  async getCampaigns(): Promise<MetaCampaign[]> {
    const data = await this.fetch<{ data: MetaCampaign[] }>(
      `${this.adAccountId}/campaigns`,
      {
        fields: "id,name,status,objective,start_time,stop_time",
        filtering: JSON.stringify([{ field: "status", operator: "IN", value: ["ACTIVE", "PAUSED"] }]),
        limit: "200",
      }
    )
    return data.data
  }

  /** Busca insights diários de um período (com paginação automática) */
  async getDailyInsights(dateFrom: string, dateTo: string): Promise<MetaInsight[]> {
    const results: MetaInsight[] = []
    let nextUrl: string | null = null

    // Primeira página
    const first = await this.fetch<{ data: MetaInsight[]; paging?: { next?: string } }>(
      `${this.adAccountId}/insights`,
      {
        level: "campaign",
        fields: "campaign_id,campaign_name,impressions,clicks,spend,actions,action_values",
        time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
        time_increment: "1",
        limit: "500",
      }
    )
    results.push(...first.data)
    nextUrl = first.paging?.next ?? null

    // Páginas seguintes
    while (nextUrl) {
      const res = await globalThis.fetch(nextUrl)
      if (!res.ok) break
      const page = await res.json() as { data: MetaInsight[]; paging?: { next?: string } }
      results.push(...page.data)
      nextUrl = page.paging?.next ?? null
    }

    return results
  }
}

/** Factory — lê credenciais do ambiente */
export function createMetaClient(): MetaAdsClient {
  const accessToken = process.env.META_ACCESS_TOKEN
  const rawAdAccountId = process.env.META_AD_ACCOUNT_ID

  if (!accessToken || !rawAdAccountId) {
    throw new Error("Meta Ads: META_ACCESS_TOKEN e META_AD_ACCOUNT_ID são obrigatórios")
  }

  // A Meta API exige o formato act_XXXXXXXXX
  const adAccountId = rawAdAccountId.startsWith("act_")
    ? rawAdAccountId
    : `act_${rawAdAccountId}`

  return new MetaAdsClient({ accessToken, adAccountId })
}
