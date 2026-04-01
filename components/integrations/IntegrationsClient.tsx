"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Wifi,
} from "lucide-react"
import { Meta, Google } from "@/components/icons/PlatformIcons"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface IntegrationCard {
  platform: "META" | "GOOGLE"
  status: "ACTIVE" | "PENDING" | "ERROR" | "DISABLED"
  lastSync: string | null
}

export interface SyncLogRow {
  id: string
  platform: "META" | "GOOGLE"
  status: "RUNNING" | "SUCCESS" | "ERROR"
  message: string | null
  records: number | null
  createdAt: string
}

interface IntegrationsClientProps {
  integrations: IntegrationCard[]
  logs: SyncLogRow[]
}

const STATUS_CONFIG = {
  ACTIVE:   { label: "Ativo",      icon: CheckCircle2, color: "text-[hsl(var(--perf-green))]" },
  PENDING:  { label: "Pendente",   icon: Clock,        color: "text-[hsl(var(--perf-yellow))]" },
  ERROR:    { label: "Erro",       icon: AlertCircle,  color: "text-[hsl(var(--perf-red))]" },
  DISABLED: { label: "Desativado", icon: XCircle,      color: "text-muted-foreground" },
}

const LOG_STATUS_CONFIG = {
  RUNNING: { label: "Executando", color: "text-[hsl(var(--perf-yellow))]" },
  SUCCESS: { label: "Sucesso",    color: "text-[hsl(var(--perf-green))]" },
  ERROR:   { label: "Erro",       color: "text-[hsl(var(--perf-red))]" },
}

function formatDate(iso: string | null) {
  if (!iso) return "Nunca"
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function IntegrationsClient({ integrations, logs }: IntegrationsClientProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ meta: string; google: string } | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)

    const res = await fetch("/api/sync", { method: "POST" })
    const data = await res.json()

    if (res.ok && data?.data) {
      const meta   = data.data.meta?.status   ?? "error"
      const google = data.data.google?.status ?? "error"
      setSyncResult({
        meta:   meta   === "SUCCESS" ? "Sincronizado com sucesso" : "Erro ao sincronizar",
        google: google === "SUCCESS" ? "Sincronizado com sucesso" : "Erro ao sincronizar",
      })
    } else {
      setSyncResult({ meta: "Erro", google: "Erro" })
    }

    setSyncing(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Cards de plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["META", "GOOGLE"] as const).map((platform) => {
          const integration = integrations.find((i) => i.platform === platform)
          const statusKey = integration?.status ?? "PENDING"
          const cfg = STATUS_CONFIG[statusKey]
          const StatusIcon = cfg.icon

          return (
            <div key={platform} className="dash-card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                    {platform === "META" ? (
                      <Meta className="w-5 h-5" />
                    ) : (
                      <Google className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {platform === "META" ? "Meta Ads" : "Google Ads"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {platform === "META"
                        ? "Facebook, Instagram & WhatsApp"
                        : "Search, Display & YouTube"}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {cfg.label}
                </div>
              </div>

              <div className="border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Última sync: {formatDate(integration?.lastSync ?? null)}</span>
                </div>
              </div>

              {syncResult && (
                <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                  {platform === "META" ? syncResult.meta : syncResult.google}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Botão de sync manual */}
      <div className="dash-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Sincronização Manual</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Importa os últimos 7 dias de dados das duas plataformas.
            O sync automático ocorre a cada 6 horas.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando…" : "Sincronizar Agora"}
        </button>
      </div>

      {/* Logs de sync */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Histórico de Sincronizações
        </h2>

        {logs.length === 0 ? (
          <div className="dash-card border-dashed border-2 border-border text-center py-10">
            <Wifi className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhuma sincronização registrada.</p>
          </div>
        ) : (
          <div className="dash-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Data", "Plataforma", "Status", "Registros", "Mensagem"].map((col) => (
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
                  {logs.map((log) => {
                    const logCfg = LOG_STATUS_CONFIG[log.status]
                    return (
                      <tr key={log.id} className="table-row-hover">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-foreground">
                            {log.platform === "META"
                              ? <Meta className="w-3.5 h-3.5" />
                              : <Google className="w-3.5 h-3.5" />
                            }
                            {log.platform === "META" ? "Meta" : "Google"}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs font-medium ${logCfg.color}`}>
                          {logCfg.label}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                          {log.records !== null ? log.records : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px] truncate">
                          {log.message ?? "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
