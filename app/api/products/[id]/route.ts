import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, err, notFound, serverError } from "@/lib/api"
import { calcProductEconomics, calcLeadEconomics } from "@/services/metrics/calculator"

const UpdateProductSchema = z.object({
  productName:          z.string().min(1).optional(),
  ticket:               z.number().positive().optional(),
  marginPercent:        z.number().min(0).max(1).optional(),
  desiredProfitPercent: z.number().min(0).max(1).optional(),
  leadEconomics: z.object({
    leadToSaleRate: z.number().min(0).max(1),
  }).optional().nullable(),
})

// PUT /api/products/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.productEconomics.findUnique({
      where: { id: params.id },
    })
    if (!existing) return notFound()

    const body   = await req.json()
    const parsed = UpdateProductSchema.safeParse(body)
    if (!parsed.success) return err("Dados inválidos", 422, parsed.error.flatten())

    const {
      productName,
      ticket         = Number(existing.ticket),
      marginPercent  = Number(existing.marginPercent),
      desiredProfitPercent = Number(existing.desiredProfitPercent),
      leadEconomics,
    } = parsed.data

    const { breakEvenCpa, idealCpa } = calcProductEconomics(
      ticket,
      marginPercent,
      desiredProfitPercent
    )

    const product = await prisma.productEconomics.update({
      where: { id: params.id },
      data: {
        ...(productName && { productName }),
        ticket,
        marginPercent,
        desiredProfitPercent,
        breakEvenCpa,
        idealCpa,
        ...(leadEconomics !== undefined && {
          leadEconomics: leadEconomics === null
            ? { delete: true }
            : {
                upsert: {
                  create: {
                    leadToSaleRate: leadEconomics.leadToSaleRate,
                    ...calcLeadEconomics(idealCpa, breakEvenCpa, leadEconomics.leadToSaleRate),
                  },
                  update: {
                    leadToSaleRate: leadEconomics.leadToSaleRate,
                    ...calcLeadEconomics(idealCpa, breakEvenCpa, leadEconomics.leadToSaleRate),
                  },
                },
              },
        }),
      },
      include: { leadEconomics: true },
    })

    return ok(product)
  } catch (e) {
    return serverError(e)
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.productEconomics.findUnique({
      where: { id: params.id },
    })
    if (!existing) return notFound()

    await prisma.productEconomics.delete({ where: { id: params.id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
