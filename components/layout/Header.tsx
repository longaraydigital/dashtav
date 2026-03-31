"use client"

import { Bell, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface HeaderProps {
  title?: string
  subtitle?: string
  totalSpend?: number
  totalRevenue?: number
}

export function Header({
  title = "Dashboard",
  subtitle,
  totalSpend,
  totalRevenue,
}: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      {/* Título */}
      <div>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Resumo rápido */}
      <div className="hidden md:flex items-center gap-6">
        {totalSpend !== undefined && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Investimento</p>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(totalSpend)}
            </p>
          </div>
        )}
        {totalRevenue !== undefined && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-sm font-semibold tabular-nums text-[hsl(var(--perf-green))]">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
