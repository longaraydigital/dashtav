"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, X, SlidersHorizontal } from "lucide-react"
import type { CampaignRow } from "@/components/campaigns/CampaignTable"
import type { Platform, ObjectiveType, PerformanceStatus } from "@/types"

interface CampaignFiltersProps {
  rows: CampaignRow[]
  onFilter: (filtered: CampaignRow[]) => void
}

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "META", label: "Meta" },
  { value: "GOOGLE", label: "Google" },
]

const OBJECTIVE_OPTIONS: { value: ObjectiveType; label: string }[] = [
  { value: "SALES", label: "Vendas" },
  { value: "LEADS", label: "Leads" },
]

const PERFORMANCE_OPTIONS: { value: PerformanceStatus; label: string; dot: string }[] = [
  { value: "GREEN", label: "Saudável", dot: "bg-[hsl(var(--perf-green))]" },
  { value: "YELLOW", label: "Atenção", dot: "bg-[hsl(var(--perf-yellow))]" },
  { value: "RED", label: "Crítico", dot: "bg-[hsl(var(--perf-red))]" },
  { value: "NO_DATA", label: "Sem dados", dot: "bg-muted-foreground" },
]

export function CampaignFilters({ rows, onFilter }: CampaignFiltersProps) {
  const [search, setSearch] = useState("")
  const [platform, setPlatform] = useState<Platform | "">("")
  const [objective, setObjective] = useState<ObjectiveType | "">("")
  const [performance, setPerformance] = useState<PerformanceStatus | "">("")

  const hasActiveFilters = search || platform || objective || performance

  const filtered = useMemo(() => {
    let result = rows

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(q))
    }

    if (platform) {
      result = result.filter((r) => r.platform === platform)
    }

    if (objective) {
      result = result.filter((r) => r.objectiveType === objective)
    }

    if (performance) {
      result = result.filter((r) => r.performanceStatus === performance)
    }

    return result
  }, [rows, search, platform, objective, performance])

  // Notifica o pai sempre que o filtro muda
  useEffect(() => {
    onFilter(filtered)
  }, [filtered, onFilter])

  function clearAll() {
    setSearch("")
    setPlatform("")
    setObjective("")
    setPerformance("")
  }

  return (
    <div className="dash-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Ícone de filtros */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filtros</span>
        </div>

        {/* Busca por nome */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>

        {/* Plataforma */}
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform | "")}
          className="px-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Plataforma</option>
          {PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Objetivo */}
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value as ObjectiveType | "")}
          className="px-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Objetivo</option>
          {OBJECTIVE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Performance */}
        <select
          value={performance}
          onChange={(e) => setPerformance(e.target.value as PerformanceStatus | "")}
          className="px-3 py-1.5 text-xs bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Performance</option>
          {PERFORMANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mt-2 text-xs text-muted-foreground">
        {filtered.length} de {rows.length} campanha{rows.length !== 1 ? "s" : ""}
        {hasActiveFilters && " (filtrado)"}
      </div>
    </div>
  )
}
