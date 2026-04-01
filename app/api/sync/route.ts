import { NextResponse } from "next/server"
import { syncMeta } from "@/services/meta/sync"
import { syncGoogle } from "@/services/google/sync"
import { ok, err, serverError } from "@/lib/api"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const maxDuration = 120 // 2 minutos (Vercel Pro/Hobby fallback)

// Função utilitária para checar autorização (Web ou Cron)
async function isAuthorized(request: Request) {
  // 1. Autorização por Cron Secret
  const authHeader = request.headers.get("authorization")
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }
  
  // 2. Autorização por Sessão Web (NextAuth)
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "ADMIN") {
    return true
  }

  return false
}

async function executeSync() {
  console.log("🔄 Iniciando sincronização via API...")
  const [metaResult, googleResult] = await Promise.all([
    syncMeta(7),   // últimos 7 dias
    syncGoogle(7),
  ])
  return { meta: metaResult, google: googleResult }
}
// POST /api/sync
// Dispara a sincronização manual das plataformas
export async function POST(request: Request) {
  try {
    if (!(await isAuthorized(request))) {
      return err("Não autorizado", 401)
    }

    const result = await executeSync()
    return ok(result)
  } catch (e) {
    console.error("❌ Erro no endpoint de sync:", e)
    return serverError(e)
  }
}

// GET /api/sync
// Retorna o status das últimas sincronizações ou dispara Vercel Cron
export async function GET(request: Request) {
  try {
    // Se for o Vercel Cron, chamamos a sync
    const authHeader = request.headers.get("authorization")
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
      const result = await executeSync()
      return ok(result)
    }

    // Caso contrário (chamada normal do Dashboard), retorna logs
    // (Também pode ser protegido por sessão se desejar)
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
