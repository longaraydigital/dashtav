import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, err, serverError } from "@/lib/api"
import { calcProductEconomics } from "@/services/metrics/calculator"

// ─────────────────────────────────────────
// VALIDAÇÃO
// ─────────────────────────────────────────

const CreateCampaignSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  platform: z.enum(["META", "GOOGLE"]),
  objectiveType: z.enum(["SALES", "LEADS"]),
  productId: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  targets: z.object({
    monthlyBudgetPlanned: z.number().positive(),
    cplTarget: z.number().positive().optional(),
    cpaTarget: z.number().positive().optional(),
    expectedLeads: z.number().int().positive().optional(),
    expectedSales: z.number().int().positive().optional(),
  }),
})

// ─────────────────────────────────────────
// GET /api/campaigns
// ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const platform      = searchParams.get("platform") as "META" | "GOOGLE" | null
    const objectiveType = searchParams.get("objectiveType") as "SALES" | "LEADS" | null
    const status        = searchParams.get("status") as string | null
    const search        = searchParams.get("search")

    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(platform      && { platform }),
        ...(objectiveType && { objectiveType }),
        ...(status        && { status: status as any }),
        ...(search        && { name: { contains: search, mode: "insensitive" } }),
      },
      include: {
        product: { include: { leadEconomics: true } },
        targets: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return ok(campaigns)
  } catch (e) {
    return serverError(e)
  }
}

// ─────────────────────────────────────────
// POST /api/campaigns
// ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateCampaignSchema.safeParse(body)

    if (!parsed.success) {
      return err("Dados inválidos", 422, parsed.error.flatten())
    }

    const { name, platform, objectiveType, productId, startDate, endDate, targets } = parsed.data

    const campaign = await prisma.campaign.create({
      data: {
        name,
        platform,
        objectiveType,
        productId: productId ?? null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        targets: {
          create: {
            monthlyBudgetPlanned: targets.monthlyBudgetPlanned,
            cplTarget: targets.cplTarget ?? null,
            cpaTarget: targets.cpaTarget ?? null,
            expectedLeads: targets.expectedLeads ?? null,
            expectedSales: targets.expectedSales ?? null,
          },
        },
      },
      include: { targets: true, product: true },
    })

    return ok(campaign, 201)
  } catch (e) {
    return serverError(e)
  }
}
