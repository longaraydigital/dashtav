import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  startOfMonth,
  endOfMonth,
  differenceInDays,
  isWithinInterval,
  eachDayOfInterval,
} from "date-fns"

// ─────────────────────────────────────────
// TAILWIND
// ─────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────
// FORMATAÇÃO
// ─────────────────────────────────────────

export function formatCurrency(
  value: number,
  locale = "pt-BR",
  currency = "BRL"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatMultiplier(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}x`
}

// ─────────────────────────────────────────
// DATAS
// ─────────────────────────────────────────

/** Dias ativos da campanha dentro do mês atual */
export function getActiveDaysInMonth(
  startDate: Date,
  endDate: Date | null,
  referenceMonth = new Date()
): number {
  const monthStart = startOfMonth(referenceMonth)
  const monthEnd = endOfMonth(referenceMonth)
  const effectiveEnd = endDate && endDate < monthEnd ? endDate : monthEnd
  const effectiveStart = startDate > monthStart ? startDate : monthStart

  if (effectiveStart > effectiveEnd) return 0
  return differenceInDays(effectiveEnd, effectiveStart) + 1
}

/** Dias decorridos da campanha até hoje dentro do mês */
export function getElapsedDays(
  startDate: Date,
  referenceMonth = new Date()
): number {
  const monthStart = startOfMonth(referenceMonth)
  const today = new Date()
  const effectiveStart = startDate > monthStart ? startDate : monthStart

  if (effectiveStart > today) return 0
  return differenceInDays(today, effectiveStart) + 1
}

// ─────────────────────────────────────────
// SAFE DIVISION
// ─────────────────────────────────────────

/** Divisão segura — retorna null se denominador for 0 */
export function safeDivide(
  numerator: number,
  denominator: number
): number | null {
  if (denominator === 0) return null
  return numerator / denominator
}
