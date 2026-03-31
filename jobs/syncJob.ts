import cron from "node-cron"
import { syncMeta } from "@/services/meta/sync"
import { syncGoogle } from "@/services/google/sync"

/**
 * Cron jobs de sincronização automática.
 *
 * Schedules:
 *  - A cada 6 horas: sync dos últimos 2 dias (dados recentes)
 *  - Todo dia às 03:00: sync dos últimos 7 dias (reconciliação)
 *
 * Para ativar, importe este arquivo em um server startup script
 * ou via Next.js instrumentation.ts
 */

async function runSync(label: string, daysBack: number) {
  console.log(`[SyncJob] Iniciando sync ${label} (${daysBack}d)`)

  const results = await Promise.allSettled([
    syncMeta(daysBack),
    syncGoogle(daysBack),
  ])

  for (const result of results) {
    if (result.status === "fulfilled") {
      const r = result.value
      console.log(`[SyncJob] ${r.platform}: ${r.status} — ${r.recordsProcessed} registros`)
    } else {
      console.error("[SyncJob] Erro inesperado:", result.reason)
    }
  }
}

export function startSyncJobs() {
  // A cada 6 horas — sync leve (2 dias)
  cron.schedule("0 */6 * * *", () => runSync("6h", 2), {
    timezone: "America/Sao_Paulo",
  })

  // Todo dia às 03:00 — sync completo (7 dias)
  cron.schedule("0 3 * * *", () => runSync("diário", 7), {
    timezone: "America/Sao_Paulo",
  })

  console.log("[SyncJob] Jobs registrados: a cada 6h + diário às 03:00 (BRT)")
}
