import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import { ProductsClient, type ProductRow } from "@/components/products/ProductsClient"

async function getProductsData(): Promise<ProductRow[]> {
  const products = await prisma.productEconomics.findMany({
    include: {
      leadEconomics: true,
      campaigns: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return products.map((p) => ({
    id: p.id,
    productName: p.productName,
    ticket: Number(p.ticket),
    marginPercent: Number(p.marginPercent),
    desiredProfitPercent: Number(p.desiredProfitPercent),
    breakEvenCpa: p.breakEvenCpa ? Number(p.breakEvenCpa) : null,
    idealCpa: p.idealCpa ? Number(p.idealCpa) : null,
    leadEconomics: p.leadEconomics
      ? {
          leadToSaleRate: Number(p.leadEconomics.leadToSaleRate),
          idealCpl: p.leadEconomics.idealCpl ? Number(p.leadEconomics.idealCpl) : null,
          breakEvenCpl: p.leadEconomics.breakEvenCpl
            ? Number(p.leadEconomics.breakEvenCpl)
            : null,
        }
      : null,
    campaignCount: p.campaigns.length,
  }))
}

export default async function ProductsPage() {
  const products = await getProductsData()

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Produtos"
        subtitle={`${products.length} produto${products.length !== 1 ? "s" : ""} cadastrado${products.length !== 1 ? "s" : ""} · CPA e CPL ideais`}
      />

      <main className="flex-1 p-6">
        <ProductsClient products={products} />
      </main>
    </div>
  )
}
