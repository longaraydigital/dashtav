import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, err, notFound, serverError } from "@/lib/api"

const UpdateCampaignSchema = z.object({
  name:         z.string().min(1).optional(),
  status:       z.enum(["ACTIVE", "PAUSED", "ENDED", "DRAFT"]).optional(),
  endDate:      z.string().optional().nullable(),
  productId:    z.string().optional().nullable(),
  targets: z.object({
    monthlyBudgetPlanned: z.number().positive().optional(),
    cplTarget:    z.number().positive().optional().nullable(),
    cpaTarget:    z.number().positive().optional().nullable(),
    expectedLeads:  z.number().int().positive().optional().nullable(),
    expectedSales:  z.number().int().positive().optional().nullable(),
  }).optional(),
})

// GET /api/campaigns/:id
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        product: { include: { leadEconomics: true } },
        targets: true,
        dailyMetrics: { orderBy: { date: "desc" }, take: 30 },
      },
    })

    if (!campaign) return notFound("Campanha")
    return ok(campaign)
  } catch (e) {
    return serverError(e)
  }
}

// PUT /api/campaigns/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body   = await req.json()
    const parsed = UpdateCampaignSchema.safeParse(body)

    if (!parsed.success) return err("Dados inválidos", 422, parsed.error.flatten())

    const { targets, ...campaignData } = parsed.data

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...campaignData,
        ...(campaignData.endDate !== undefined && {
          endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
        }),
        ...(targets && {
          targets: {
            upsert: {
              create: {
                monthlyBudgetPlanned: targets.monthlyBudgetPlanned ?? 0,
                ...targets,
              },
              update: targets,
            },
          },
        }),
      },
      include: { targets: true, product: true },
    })

    return ok(campaign)
  } catch (e: any) {
    if (e?.code === "P2025") return notFound("Campanha")
    return serverError(e)
  }
}

// DELETE /api/campaigns/:id
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.campaign.delete({ where: { id } })
    return ok({ id })
  } catch (e: any) {
    if (e?.code === "P2025") return notFound("Campanha")
    return serverError(e)
  }
}
