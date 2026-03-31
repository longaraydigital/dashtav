import type { CampaignRow } from "@/components/campaigns/CampaignTable"
import type { LineChartData, BarChartData, PieChartData } from "@/components/dashboard/Charts"

// ─────────────────────────────────────────
// TABELA DE CAMPANHAS
// ─────────────────────────────────────────

export const MOCK_CAMPAIGNS: CampaignRow[] = [
  {
    id: "1",
    name: "Meta — Produto X — Conversão",
    platform: "META",
    objectiveType: "SALES",
    cost: 8420,
    leads: 0,
    sales: 42,
    cpa: 200.48,
    cpl: null,
    roas: 4.21,
    profit: 12780,
    performanceStatus: "GREEN",
  },
  {
    id: "2",
    name: "Google — Produto X — Search",
    platform: "GOOGLE",
    objectiveType: "SALES",
    cost: 5100,
    leads: 0,
    sales: 18,
    cpa: 283.33,
    cpl: null,
    roas: 2.94,
    profit: 1900,
    performanceStatus: "YELLOW",
  },
  {
    id: "3",
    name: "Meta — Captação de Leads — Ebook",
    platform: "META",
    objectiveType: "LEADS",
    cost: 3200,
    leads: 640,
    sales: 0,
    cpa: null,
    cpl: 5.0,
    roas: null,
    profit: null,
    performanceStatus: "GREEN",
  },
  {
    id: "4",
    name: "Google — Display — Remarketing",
    platform: "GOOGLE",
    objectiveType: "LEADS",
    cost: 1850,
    leads: 148,
    sales: 0,
    cpa: null,
    cpl: 12.5,
    roas: null,
    profit: null,
    performanceStatus: "YELLOW",
  },
  {
    id: "5",
    name: "Meta — Produto Y — Tráfego Frio",
    platform: "META",
    objectiveType: "SALES",
    cost: 4600,
    leads: 0,
    sales: 9,
    cpa: 511.11,
    cpl: null,
    roas: 1.37,
    profit: -930,
    performanceStatus: "RED",
  },
]

// ─────────────────────────────────────────
// KPIs GLOBAIS
// ─────────────────────────────────────────

export const MOCK_KPIS = {
  totalInvestment: 23170,
  totalRevenue: 97450,
  totalProfit: 14750,
  roas: 4.21,
  cpa: 241.35,
  cpl: 8.75,
  investmentChange: 12.4,
  revenueChange: 28.7,
  profitChange: 18.2,
  roasChange: 14.3,
  cpaChange: -8.5,   // negativo = melhora (CPA caiu)
  cplChange: -12.1,
}

// ─────────────────────────────────────────
// GRÁFICO DE LINHA — últimos 14 dias
// ─────────────────────────────────────────

export const MOCK_LINE_DATA: LineChartData[] = [
  { date: "18/03", custo: 1420, faturamento: 5800 },
  { date: "19/03", custo: 1580, faturamento: 6200 },
  { date: "20/03", custo: 1350, faturamento: 5100 },
  { date: "21/03", custo: 1200, faturamento: 4900 },
  { date: "22/03", custo: 900,  faturamento: 3600 },
  { date: "23/03", custo: 950,  faturamento: 3900 },
  { date: "24/03", custo: 1680, faturamento: 7200 },
  { date: "25/03", custo: 1720, faturamento: 7400 },
  { date: "26/03", custo: 1650, faturamento: 6900 },
  { date: "27/03", custo: 1800, faturamento: 7800 },
  { date: "28/03", custo: 1900, faturamento: 8200 },
  { date: "29/03", custo: 1720, faturamento: 7100 },
  { date: "30/03", custo: 1850, faturamento: 8100 },
  { date: "31/03", custo: 1950, faturamento: 9250 },
]

// ─────────────────────────────────────────
// GRÁFICO DE BARRA — CPA por campanha
// ─────────────────────────────────────────

export const MOCK_BAR_DATA: BarChartData[] = [
  { name: "Meta Conv.", cpa: 200, meta: 220 },
  { name: "Google Search", cpa: 283, meta: 250 },
  { name: "Meta Frio", cpa: 511, meta: 280 },
]

// ─────────────────────────────────────────
// GRÁFICO DE PIZZA — distribuição de custo
// ─────────────────────────────────────────

export const MOCK_PIE_DATA: PieChartData[] = [
  { name: "Meta", value: 16220 },
  { name: "Google", value: 6950 },
]
