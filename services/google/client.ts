/**
 * Google Ads API Client
 * Docs: https://developers.google.com/google-ads/api/docs/start
 * Usa REST API (não o SDK Node.js) para manter zero dependência async
 */

const GOOGLE_ADS_BASE = "https://googleads.googleapis.com/v17"

interface GoogleAdsOptions {
  clientId: string
  clientSecret: string
  refreshToken: string
  developerToken: string
  customerId: string  // formato: XXXXXXXXXX (sem hífens)
}

export interface GoogleCampaign {
  campaign: {
    id: string
    name: string
    status: "ENABLED" | "PAUSED" | "REMOVED"
    advertisingChannelType: string
    startDate: string
    endDate?: string
  }
}

export interface GoogleMetricRow {
  campaign: { id: string; name: string }
  segments: { date: string }
  metrics: {
    impressions: string
    clicks: string
    costMicros: string   // custo em micros (divide por 1_000_000)
    conversions: string
    conversionsValue: string
  }
}

export class GoogleAdsClient {
  private options: GoogleAdsOptions
  private accessToken: string | null = null

  constructor(options: GoogleAdsOptions) {
    this.options = options
  }

  /** Obtém access token via refresh token (OAuth2) */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const res = await globalThis.fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     this.options.clientId,
        client_secret: this.options.clientSecret,
        refresh_token: this.options.refreshToken,
        grant_type:    "refresh_token",
      }),
    })

    if (!res.ok) throw new Error(`Google OAuth error: ${res.status}`)
    const data = await res.json()
    this.accessToken = data.access_token
    return data.access_token
  }

  private async query<T>(gaql: string): Promise<T[]> {
    const token = await this.getAccessToken()
    const customerId = this.options.customerId.replace(/-/g, "")

    const res = await globalThis.fetch(
      `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          Authorization:         `Bearer ${token}`,
          "developer-token":     this.options.developerToken,
          "Content-Type":        "application/json",
        },
        body: JSON.stringify({ query: gaql }),
      }
    )

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(`Google Ads API error ${res.status}: ${JSON.stringify(error)}`)
    }

    const data = await res.json()
    return (data.results ?? []) as T[]
  }

  async getCampaigns(): Promise<GoogleCampaign[]> {
    return this.query<GoogleCampaign>(`
      SELECT campaign.id, campaign.name, campaign.status,
             campaign.advertising_channel_type,
             campaign.start_date, campaign.end_date
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
    `)
  }

  async getDailyMetrics(dateFrom: string, dateTo: string): Promise<GoogleMetricRow[]> {
    return this.query<GoogleMetricRow>(`
      SELECT campaign.id, campaign.name,
             segments.date,
             metrics.impressions, metrics.clicks,
             metrics.cost_micros, metrics.conversions,
             metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        AND campaign.status IN ('ENABLED', 'PAUSED')
    `)
  }
}

export function createGoogleClient(): GoogleAdsClient {
  const required = [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ]

  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    throw new Error(`Google Ads: variáveis faltando: ${missing.join(", ")}`)
  }

  return new GoogleAdsClient({
    clientId:       process.env.GOOGLE_ADS_CLIENT_ID!,
    clientSecret:   process.env.GOOGLE_ADS_CLIENT_SECRET!,
    refreshToken:   process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    customerId:     process.env.GOOGLE_ADS_CUSTOMER_ID!,
  })
}
