import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { CampaignsClient } from "@/components/campaigns/CampaignsClient"
import { getCampaignsData } from "@/lib/campaigns-data"

export default async function CampaignsPage() {
  const data = await getCampaignsData()

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Campanhas"
        subtitle={`${data.rows.length} campanha${data.rows.length !== 1 ? "s" : ""} cadastrada${data.rows.length !== 1 ? "s" : ""}`}
      />

      <main className="flex-1 p-6 space-y-4">
        {!data.hasData ? (
          <div className="dash-card border-dashed border-2 border-border text-center py-16">
            <p className="text-muted-foreground text-sm">
              Nenhuma campanha cadastrada ainda.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Crie campanhas pela API ou sincronize com as plataformas.
            </p>
          </div>
        ) : (
          <CampaignsClient rows={data.rows} />
        )}
      </main>
    </div>
  )
}
