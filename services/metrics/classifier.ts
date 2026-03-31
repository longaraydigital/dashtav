import type { PerformanceClassification, PerformanceStatus } from "@/types"

// ─────────────────────────────────────────
// CLASSIFICAÇÃO DE PERFORMANCE
//
// SALES:
//   verde:    CPA <= ideal_cpa
//   amarelo:  ideal_cpa < CPA <= break_even_cpa
//   vermelho: CPA > break_even_cpa
//
// LEADS:
//   verde:    CPL <= ideal_cpl
//   amarelo:  ideal_cpl < CPL <= break_even_cpl
//   vermelho: CPL > break_even_cpl
// ─────────────────────────────────────────

function classify(
  value: number | null,
  ideal: number | null,
  breakEven: number | null
): PerformanceStatus {
  if (value === null || ideal === null || breakEven === null) return "NO_DATA"
  if (value <= ideal) return "GREEN"
  if (value <= breakEven) return "YELLOW"
  return "RED"
}

const STATUS_LABELS: Record<PerformanceStatus, string> = {
  GREEN: "Dentro do ideal",
  YELLOW: "Atenção",
  RED: "Crítico",
  NO_DATA: "Sem dados",
}

export function classifySalesPerformance(
  cpaReal: number | null,
  idealCpa: number | null,
  breakEvenCpa: number | null
): PerformanceClassification {
  const status = classify(cpaReal, idealCpa, breakEvenCpa)
  return {
    status,
    label: STATUS_LABELS[status],
    value: cpaReal,
    target: null,
    ideal: idealCpa,
    breakEven: breakEvenCpa,
  }
}

export function classifyLeadsPerformance(
  cplReal: number | null,
  idealCpl: number | null,
  breakEvenCpl: number | null
): PerformanceClassification {
  const status = classify(cplReal, idealCpl, breakEvenCpl)
  return {
    status,
    label: STATUS_LABELS[status],
    value: cplReal,
    target: null,
    ideal: idealCpl,
    breakEven: breakEvenCpl,
  }
}

/** Mapeamento de status para classes Tailwind */
export const PERFORMANCE_CLASSES: Record<
  PerformanceStatus,
  { bg: string; text: string; border: string }
> = {
  GREEN: {
    bg: "bg-performance-green-bg",
    text: "text-performance-green",
    border: "border-performance-green",
  },
  YELLOW: {
    bg: "bg-performance-yellow-bg",
    text: "text-performance-yellow",
    border: "border-performance-yellow",
  },
  RED: {
    bg: "bg-performance-red-bg",
    text: "text-performance-red",
    border: "border-performance-red",
  },
  NO_DATA: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted",
  },
}
