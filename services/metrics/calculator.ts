import { safeDivide, getActiveDaysInMonth, getElapsedDays } from "@/lib/utils"
import type {
  SalesCalculations,
  LeadsCalculations,
  BudgetPacing,
  ProductEconomicsData,
  LeadEconomicsData,
  AggregatedMetrics,
  DailyMetricData,
} from "@/types"
import { classifySalesPerformance, classifyLeadsPerformance } from "./classifier"

// ─────────────────────────────────────────
// ECONOMICS — cálculos de produto
// ─────────────────────────────────────────

export function calcProductEconomics(
  ticket: number,
  marginPercent: number,
  desiredProfitPercent: number
): { breakEvenCpa: number; idealCpa: number } {
  return {
    breakEvenCpa: ticket * marginPercent,
    idealCpa: ticket * (marginPercent - desiredProfitPercent),
  }
}

export function calcLeadEconomics(
  idealCpa: number,
  breakEvenCpa: number,
  leadToSaleRate: number
): { idealCpl: number; breakEvenCpl: number } {
  return {
    idealCpl: idealCpa * leadToSaleRate,
    breakEvenCpl: breakEvenCpa * leadToSaleRate,
  }
}

// ─────────────────────────────────────────
// CÁLCULOS DE VENDA (SALES)
// ─────────────────────────────────────────

export function calcSalesMetrics(
  cost: number,
  revenue: number,
  clicks: number,
  sales: number,
  product: ProductEconomicsData | null
): SalesCalculations {
  const cpaReal = safeDivide(cost, sales)
  const roas = safeDivide(revenue, cost)
  const conversionRate = safeDivide(sales, clicks)

  const ticket = product?.ticket ?? null
  const breakEvenCpa = product?.breakEvenCpa ?? null
  const idealCpa = product?.idealCpa ?? null

  const profitPerSale =
    ticket !== null && cpaReal !== null ? ticket - cpaReal : null

  const totalProfit = revenue - cost
  const marginRealPercent = safeDivide(totalProfit, revenue)

  const performance = classifySalesPerformance(cpaReal, idealCpa, breakEvenCpa)

  return {
    cpaReal,
    roas,
    conversionRate,
    profitPerSale,
    totalProfit,
    marginRealPercent,
    breakEvenCpa,
    idealCpa,
    performance,
  }
}

// ─────────────────────────────────────────
// CÁLCULOS DE LEADS
// ─────────────────────────────────────────

export function calcLeadsMetrics(
  cost: number,
  leads: number,
  sales: number,
  product: ProductEconomicsData | null,
  leadEconomics: LeadEconomicsData | null
): LeadsCalculations {
  const cplReal = safeDivide(cost, leads)
  const leadToSaleRate = safeDivide(sales, leads)

  const ticket = product?.ticket ?? null
  const marginPercent = product?.marginPercent ?? null
  const idealCpl = leadEconomics?.idealCpl ?? null
  const breakEvenCpl = leadEconomics?.breakEvenCpl ?? null

  // value_per_lead = ticket * lead_to_sale_rate * margin_percent
  const valuePerLead =
    ticket !== null &&
    leadToSaleRate !== null &&
    marginPercent !== null
      ? ticket * leadToSaleRate * marginPercent
      : null

  const performance = classifyLeadsPerformance(cplReal, idealCpl, breakEvenCpl)

  return {
    cplReal,
    leadToSaleRate,
    idealCpl,
    breakEvenCpl,
    valuePerLead,
    performance,
  }
}

// ─────────────────────────────────────────
// MÉTRICAS DIÁRIAS INDIVIDUAIS
// ─────────────────────────────────────────

export function calcDailyMetrics(
  impressions: number,
  clicks: number,
  cost: number,
  leads: number,
  sales: number,
  revenue: number
): {
  ctr: number | null
  cplReal: number | null
  cpaReal: number | null
  roas: number | null
  conversionRate: number | null
} {
  return {
    ctr: safeDivide(clicks, impressions),
    cplReal: safeDivide(cost, leads),
    cpaReal: safeDivide(cost, sales),
    roas: safeDivide(revenue, cost),
    conversionRate: safeDivide(sales, clicks),
  }
}

// ─────────────────────────────────────────
// AGREGAÇÃO DE MÉTRICAS (período)
// ─────────────────────────────────────────

export function aggregateMetrics(metrics: DailyMetricData[]): AggregatedMetrics {
  if (metrics.length === 0) {
    return {
      totalCost: 0,
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0,
      totalSales: 0,
      avgCtr: null,
      avgCplReal: null,
      avgCpaReal: null,
      avgRoas: null,
      avgConversionRate: null,
    }
  }

  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0)
  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0)
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0)
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0)
  const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0)
  const totalSales = metrics.reduce((sum, m) => sum + m.sales, 0)

  // Médias derivadas dos totais agregados (não média das médias diárias)
  return {
    totalCost,
    totalRevenue,
    totalImpressions,
    totalClicks,
    totalLeads,
    totalSales,
    avgCtr: safeDivide(totalClicks, totalImpressions),
    avgCplReal: safeDivide(totalCost, totalLeads),
    avgCpaReal: safeDivide(totalCost, totalSales),
    avgRoas: safeDivide(totalRevenue, totalCost),
    avgConversionRate: safeDivide(totalSales, totalClicks),
  }
}

// ─────────────────────────────────────────
// ORÇAMENTO E PACING
// ─────────────────────────────────────────

export function calcBudgetPacing(
  monthlyBudgetPlanned: number,
  cumulativeSpendMonth: number,
  dailySpends: number[],
  startDate: Date,
  endDate: Date | null,
  referenceDate = new Date()
): BudgetPacing {
  const activeDaysInMonth = getActiveDaysInMonth(startDate, endDate, referenceDate)
  const elapsedDays = getElapsedDays(startDate, referenceDate)

  const dailyBudgetTarget = safeDivide(monthlyBudgetPlanned, activeDaysInMonth) ?? 0
  const expectedSpendUntilToday = dailyBudgetTarget * elapsedDays
  const budgetDeviation = cumulativeSpendMonth - expectedSpendUntilToday
  const remainingBudgetMonth = monthlyBudgetPlanned - cumulativeSpendMonth

  // Projeção: média diária * dias ativos restantes
  const avgDailySpend =
    elapsedDays > 0
      ? cumulativeSpendMonth / elapsedDays
      : dailyBudgetTarget
  const projectedMonthEndSpend = avgDailySpend * activeDaysInMonth

  const spendPercent = safeDivide(cumulativeSpendMonth, monthlyBudgetPlanned) ?? 0

  return {
    monthlyBudgetPlanned,
    cumulativeSpendMonth,
    expectedSpendUntilToday,
    budgetDeviation,
    remainingBudgetMonth,
    projectedMonthEndSpend,
    activeDaysInMonth,
    elapsedDays,
    dailyBudgetTarget,
    spendPercent,
  }
}
