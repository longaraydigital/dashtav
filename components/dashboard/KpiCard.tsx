import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  label: string
  value: string
  change?: number        // percentual de variação (ex: 12.5 = +12.5%)
  icon?: LucideIcon
  variant?: "default" | "green" | "red" | "yellow" | "purple"
  loading?: boolean
  description?: string
}

const VARIANT_STYLES = {
  default: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  green: {
    icon: "bg-[hsl(var(--perf-green-bg))] text-[hsl(var(--perf-green))]",
    value: "text-[hsl(var(--perf-green))]",
  },
  red: {
    icon: "bg-[hsl(var(--perf-red-bg))] text-[hsl(var(--perf-red))]",
    value: "text-[hsl(var(--perf-red))]",
  },
  yellow: {
    icon: "bg-[hsl(var(--perf-yellow-bg))] text-[hsl(var(--perf-yellow))]",
    value: "text-[hsl(var(--perf-yellow))]",
  },
  purple: {
    icon: "bg-accent/10 text-accent",
    value: "text-accent",
  },
}

export function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  variant = "default",
  loading = false,
  description,
}: KpiCardProps) {
  const styles = VARIANT_STYLES[variant]

  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change !== undefined && change === 0

  if (loading) {
    return (
      <div className="dash-card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="h-9 w-9 rounded-lg bg-secondary" />
          <div className="h-4 w-16 rounded bg-secondary" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-7 w-28 rounded bg-secondary" />
          <div className="h-3 w-20 rounded bg-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="dash-card animate-slide-up" data-metric>
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", styles.icon)}>
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Variação */}
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              isPositive && "bg-[hsl(var(--perf-green-bg))] text-[hsl(var(--perf-green))]",
              isNegative && "bg-[hsl(var(--perf-red-bg))] text-[hsl(var(--perf-red))]",
              isNeutral && "bg-muted text-muted-foreground"
            )}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isNeutral && <Minus className="w-3 h-3" />}
            {isPositive ? "+" : ""}{change.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className={cn("text-2xl font-bold tracking-tight tabular-nums", styles.value)}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}
