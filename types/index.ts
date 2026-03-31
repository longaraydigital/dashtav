import type {
  Platform,
  ObjectiveType,
  CampaignStatus,
  IntegrationStatus,
  SyncStatus,
} from "@prisma/client"

// ─────────────────────────────────────────
// RE-EXPORTS DOS ENUMS PRISMA
// ─────────────────────────────────────────

export type { Platform, ObjectiveType, CampaignStatus, IntegrationStatus, SyncStatus }

// ─────────────────────────────────────────
// CLASSIFICAÇÃO DE PERFORMANCE
// ─────────────────────────────────────────

export type PerformanceStatus = "GREEN" | "YELLOW" | "RED" | "NO_DATA"

export interface PerformanceClassification {
  status: PerformanceStatus
  label: string
  value: number | null
  target: number | null     // cpa_target ou cpl_target (meta manual)
  ideal: number | null      // ideal_cpa ou ideal_cpl (calculado do economics)
  breakEven: number | null  // break_even_cpa ou break_even_cpl
}

// ─────────────────────────────────────────
// ECONOMICS
// ─────────────────────────────────────────

export interface ProductEconomicsData {
  id: string
  productName: string
  ticket: number
  marginPercent: number
  desiredProfitPercent: number
  breakEvenCpa: number | null
  idealCpa: number | null
  leadEconomics: LeadEconomicsData | null
}

export interface LeadEconomicsData {
  leadToSaleRate: number
  idealCpl: number | null
  breakEvenCpl: number | null
}

export interface ProductEconomicsFormInput {
  productName: string
  ticket: number
  marginPercent: number       // 0–1 (ex: 0.40 = 40%)
  desiredProfitPercent: number
  leadEconomics?: {
    leadToSaleRate: number
  }
}

// ─────────────────────────────────────────
// CAMPANHAS
// ─────────────────────────────────────────

export interface CampaignWithRelations {
  id: string
  name: string
  platform: Platform
  objectiveType: ObjectiveType
  status: CampaignStatus
  startDate: Date
  endDate: Date | null
  externalId: string | null
  createdAt: Date
  product: ProductEconomicsData | null
  targets: CampaignTargetData | null
}

export interface CampaignTargetData {
  monthlyBudgetPlanned: number
  cplTarget: number | null
  cpaTarget: number | null
  expectedLeads: number | null
  expectedSales: number | null
}

export interface CampaignFormInput {
  name: string
  platform: Platform
  objectiveType: ObjectiveType
  productId?: string
  startDate: string   // ISO date string
  endDate?: string
  targets: CampaignTargetInput
}

export interface CampaignTargetInput {
  monthlyBudgetPlanned: number
  cplTarget?: number
  cpaTarget?: number
  expectedLeads?: number
  expectedSales?: number
}

// ─────────────────────────────────────────
// MÉTRICAS BRUTAS
// ─────────────────────────────────────────

export interface DailyMetricData {
  id: string
  date: Date
  campaignId: string
  platform: Platform
  impressions: number
  clicks: number
  cost: number
  leads: number
  sales: number
  revenue: number
  // Calculados e persistidos
  ctr: number | null
  cplReal: number | null
  cpaReal: number | null
  roas: number | null
  conversionRate: number | null
}

// ─────────────────────────────────────────
// MÉTRICAS AGREGADAS (dashboard / tabelas)
// ─────────────────────────────────────────

export interface AggregatedMetrics {
  totalCost: number
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  totalLeads: number
  totalSales: number
  avgCtr: number | null
  avgCplReal: number | null
  avgCpaReal: number | null
  avgRoas: number | null
  avgConversionRate: number | null
}

// ─────────────────────────────────────────
// CÁLCULOS DE VENDA (SALES)
// ─────────────────────────────────────────

export interface SalesCalculations {
  cpaReal: number | null
  roas: number | null
  conversionRate: number | null
  profitPerSale: number | null
  totalProfit: number | null
  marginRealPercent: number | null
  breakEvenCpa: number | null
  idealCpa: number | null
  performance: PerformanceClassification
}

// ─────────────────────────────────────────
// CÁLCULOS DE LEADS
// ─────────────────────────────────────────

export interface LeadsCalculations {
  cplReal: number | null
  leadToSaleRate: number | null
  idealCpl: number | null
  breakEvenCpl: number | null
  valuePerLead: number | null
  performance: PerformanceClassification
}

// ─────────────────────────────────────────
// ORÇAMENTO E PACING
// ─────────────────────────────────────────

export interface BudgetPacing {
  monthlyBudgetPlanned: number
  cumulativeSpendMonth: number
  expectedSpendUntilToday: number
  /** Positivo = acima do ritmo planejado */
  budgetDeviation: number
  remainingBudgetMonth: number
  projectedMonthEndSpend: number
  activeDaysInMonth: number
  elapsedDays: number
  dailyBudgetTarget: number
  /** Percentual gasto do orçamento mensal */
  spendPercent: number
}

// ─────────────────────────────────────────
// NORMALIZAÇÃO DE PLATAFORMAS
// Formato interno após passar pelo mapper Meta/Google
// ─────────────────────────────────────────

export interface NormalizedCampaignMetric {
  externalCampaignId: string
  platform: Platform
  date: Date
  impressions: number
  clicks: number
  /** Custo em BRL (ou moeda local — converter no mapper) */
  cost: number
  leads: number
  /** Conversões finais: vendas para SALES, leads para LEADS */
  conversions: number
  revenue: number
}

// ─────────────────────────────────────────
// INTEGRAÇÕES E SYNC
// ─────────────────────────────────────────

export interface IntegrationData {
  platform: Platform
  status: IntegrationStatus
  lastSync: Date | null
}

export interface SyncResult {
  platform: Platform
  status: SyncStatus
  recordsProcessed: number
  message?: string
  error?: string
}

// ─────────────────────────────────────────
// FILTROS DE LISTAGEM
// ─────────────────────────────────────────

export interface CampaignFilters {
  platform?: Platform
  objectiveType?: ObjectiveType
  status?: CampaignStatus
  productId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface MetricsDateRange {
  from: Date
  to: Date
}

// ─────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  success: true
}

export interface ApiError {
  error: string
  success: false
  details?: unknown
}

export type ApiResult<T> = ApiResponse<T> | ApiError
