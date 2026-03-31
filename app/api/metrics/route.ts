import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, err, serverError } from "@/lib/api"
import { aggregateMetrics } from "@/services/metrics/calculator"

// GET /api/metrics?campaignId=&from=&to=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const campaignId = searchParams.get("campaignId")
    const from       = searchParams.get("from")
    const to         = searchParams.get("to")

    if (!from || !to) return err("Parâmetros 'from' e 'to' são obrigatórios")

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        ...(campaignId && { campaignId }),
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { date: "asc" },
    })

    // Converte Decimal → number para serialização
    const normalized = metrics.map((m) => ({
      ...m,
      cost:           Number(m.cost),
      revenue:        Number(m.revenue),
      ctr:            m.ctr           ? Number(m.ctr)           : null,
      cplReal:        m.cplReal       ? Number(m.cplReal)       : null,
      cpaReal:        m.cpaReal       ? Number(m.cpaReal)       : null,
      roas:           m.roas          ? Number(m.roas)          : null,
      conversionRate: m.conversionRate ? Number(m.conversionRate) : null,
    }))

    const aggregated = aggregateMetrics(normalized)

    return ok({ metrics: normalized, aggregated })
  } catch (e) {
    return serverError(e)
  }
}
