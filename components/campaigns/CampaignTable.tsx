"use client"

import { cn, formatCurrency, formatNumber, formatMultiplier } from "@/lib/utils"
import { StatusBadge, ActionBadge } from "./StatusBadge"
import type { PerformanceStatus, Platform, ObjectiveType } from "@/types"
import { Meta, Google } from "@/components/icons/PlatformIcons"

export interface CampaignRow {
  id: string
  name: string
  platform: Platform
  objectiveType: ObjectiveType
  cost: number
  leads: number
  sales: number
  cpa: number | null
  cpl: number | null
  roas: number | null
  profit: number | null
  performanceStatus: PerformanceStatus
}

interface CampaignTableProps {
  rows: CampaignRow[]
  loading?: boolean
}

const PLATFORM_LABEL: Record<Platform, string> = {
  META: "Meta",
  GOOGLE: "Google",
}

const OBJECTIVE_LABEL: Record<ObjectiveType, string> = {
  SALES: "Vendas",
  LEADS: "Leads",
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-secondary animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function CampaignTable({ rows, loading = false }: CampaignTableProps) {
  return (
    <div className="dash-card p-0 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                "Campanha", "Plataforma", "Objetivo",
                "Custo", "Leads", "Vendas",
                "CPA", "CPL", "ROAS",
                "Lucro", "Status",
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : rows.map((row) => (
                  <tr key={row.id} className="table-row-hover">
                    {/* Campanha */}
                    <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">
                      {row.name}
                    </td>

                    {/* Plataforma */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {PLATFORM_LABEL[row.platform]}
                      </span>
                    </td>

                    {/* Objetivo */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        row.objectiveType === "SALES"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      )}>
                        {OBJECTIVE_LABEL[row.objectiveType]}
                      </span>
                    </td>

                    {/* Custo */}
                    <td className="px-4 py-3 tabular-nums text-foreground">
                      {formatCurrency(row.cost)}
                    </td>

                    {/* Leads */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {row.objectiveType === "LEADS" ? formatNumber(row.leads) : "—"}
                    </td>

                    {/* Vendas */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {row.objectiveType === "SALES" ? formatNumber(row.sales) : "—"}
                    </td>

                    {/* CPA */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {row.cpa !== null ? formatCurrency(row.cpa) : "—"}
                    </td>

                    {/* CPL */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {row.cpl !== null ? formatCurrency(row.cpl) : "—"}
                    </td>

                    {/* ROAS */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {row.roas !== null ? formatMultiplier(row.roas) : "—"}
                    </td>

                    {/* Lucro */}
                    <td className={cn(
                      "px-4 py-3 tabular-nums font-medium",
                      row.profit !== null && row.profit >= 0
                        ? "text-[hsl(var(--perf-green))]"
                        : "text-[hsl(var(--perf-red))]"
                    )}>
                      {row.profit !== null ? formatCurrency(row.profit) : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <ActionBadge status={row.performanceStatus} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && rows.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Nenhuma campanha encontrada.
          </div>
        )}
      </div>
    </div>
  )
}
