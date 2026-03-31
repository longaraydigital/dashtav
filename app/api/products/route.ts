import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, err, serverError } from "@/lib/api"
import { calcProductEconomics, calcLeadEconomics } from "@/services/metrics/calculator"

const ProductSchema = z.object({
  productName:          z.string().min(1),
  ticket:               z.number().positive(),
  marginPercent:        z.number().min(0).max(1),
  desiredProfitPercent: z.number().min(0).max(1),
  leadEconomics: z.object({
    leadToSaleRate: z.number().min(0).max(1),
  }).optional(),
})

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.productEconomics.findMany({
      include: { leadEconomics: true },
      orderBy: { createdAt: "desc" },
    })
    return ok(products)
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = ProductSchema.safeParse(body)

    if (!parsed.success) return err("Dados inválidos", 422, parsed.error.flatten())

    const { productName, ticket, marginPercent, desiredProfitPercent, leadEconomics } = parsed.data

    // Calcular e persistir economics
    const { breakEvenCpa, idealCpa } = calcProductEconomics(ticket, marginPercent, desiredProfitPercent)

    const product = await prisma.productEconomics.create({
      data: {
        productName,
        ticket,
        marginPercent,
        desiredProfitPercent,
        breakEvenCpa,
        idealCpa,
        ...(leadEconomics && {
          leadEconomics: {
            create: {
              leadToSaleRate: leadEconomics.leadToSaleRate,
              ...calcLeadEconomics(idealCpa, breakEvenCpa, leadEconomics.leadToSaleRate),
            },
          },
        }),
      },
      include: { leadEconomics: true },
    })

    return ok(product, 201)
  } catch (e) {
    return serverError(e)
  }
}
