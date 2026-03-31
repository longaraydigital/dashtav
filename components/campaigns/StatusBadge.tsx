import { cn } from "@/lib/utils"
import type { PerformanceStatus } from "@/types"

interface StatusBadgeProps {
  status: PerformanceStatus
  showLabel?: boolean
}

const STATUS_CONFIG: Record<
  PerformanceStatus,
  { label: string; actionLabel: string; dot: string; className: string }
> = {
  GREEN: {
    label: "Ótimo",
    actionLabel: "Escalar",
    dot: "bg-[hsl(var(--perf-green))]",
    className: "status-green",
  },
  YELLOW: {
    label: "Atenção",
    actionLabel: "Otimizar",
    dot: "bg-[hsl(var(--perf-yellow))]",
    className: "status-yellow",
  },
  RED: {
    label: "Crítico",
    actionLabel: "Pausar",
    dot: "bg-[hsl(var(--perf-red))]",
    className: "status-red",
  },
  NO_DATA: {
    label: "Sem dados",
    actionLabel: "—",
    dot: "bg-muted-foreground",
    className: "status-nodata",
  },
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {showLabel ? config.label : config.actionLabel}
    </span>
  )
}

/** Badge de ação recomendada (Escalar / Otimizar / Pausar) */
export function ActionBadge({ status }: { status: PerformanceStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase",
        config.className
      )}
    >
      {config.actionLabel}
    </span>
  )
}
