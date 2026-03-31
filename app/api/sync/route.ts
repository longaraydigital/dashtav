import { NextResponse } from "next/server"
import { syncMeta } from "@/services/meta/sync"
import { syncGoogle } from "@/services/google/sync"
import { ok, serverError } from "@/lib/api"

// POST /api/sync
// Dispara a sincronização manual das plataformas
export async function POST() {
  try {
    console.log("🔄 Iniciando sincronização via API...")
    
    // Executa syncs em paralelo
    const [metaResult, googleResult] = await Promise.all([
      syncMeta(7),   // últimos 7 dias
      syncGoogle(7),
    ])

    return ok({
      meta: metaResult,
      google: googleResult,
    })
  } catch (e) {
    console.error("❌ Erro no endpoint de sync:", e)
    return serverError(e)
  }
}

// GET /api/sync
// Retorna o status das últimas sincronizações (opcional, mas útil para debug)
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma")
    const logs = await prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    
    return ok(logs)
  } catch (e) {
    return serverError(e)
  }
}
