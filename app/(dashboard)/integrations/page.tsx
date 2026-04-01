import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
import {
  IntegrationsClient,
  type IntegrationCard,
  type SyncLogRow,
} from "@/components/integrations/IntegrationsClient"

async function getIntegrationsData() {
  const [integrations, logs] = await Promise.all([
    prisma.integration.findMany({ orderBy: { platform: "asc" } }),
    prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const cards: IntegrationCard[] = (["META", "GOOGLE"] as const).map((platform) => {
    const found = integrations.find((i) => i.platform === platform)
    return {
      platform,
      status: found?.status ?? "PENDING",
      lastSync: found?.lastSync?.toISOString() ?? null,
    }
  })

  const logRows: SyncLogRow[] = logs.map((l) => ({
    id: l.id,
    platform: l.platform,
    status: l.status,
    message: l.message,
    records: l.records,
    createdAt: l.createdAt.toISOString(),
  }))

  return { cards, logRows }
}

export default async function IntegrationsPage() {
  const { cards, logRows } = await getIntegrationsData()

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Integrações"
        subtitle="Status das plataformas de anúncios · Meta Ads e Google Ads"
      />

      <main className="flex-1 p-6">
        <IntegrationsClient integrations={cards} logs={logRows} />
      </main>
    </div>
  )
}
