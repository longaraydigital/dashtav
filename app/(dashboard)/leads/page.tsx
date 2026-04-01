import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { LeadsLineChart } from "@/components/dashboard/Charts"
import { CampaignTable } from "@/components/campaigns/CampaignTable"
import { Users, DollarSign, TrendingUp, Megaphone } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { getLeadsData } from "@/lib/leads-data"

export default async function LeadsPage() {
  const data = await getLeadsData()
  const k    = data.kpis

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Leads"
        subtitle={`Captação de leads · ${data.periodLabel}`}
      />

      <main className="flex-1 p-6 space-y-6">
        {!data.hasData && (
          <div className="dash-card border-dashed border-2 border-border text-center py-10">
            <p className="text-muted-foreground text-sm">
              Nenhum dado de leads encontrado para o período atual.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Sincronize as plataformas ou crie campanhas com objetivo Leads.
            </p>
          </div>
        )}

        {/* ── KPI Cards */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total de Leads"
              value={formatNumber(k.totalLeads)}
              icon={Users}
              variant="green"
            />
            <KpiCard
              label="Investimento"
              value={formatCurrency(k.totalCost)}
              icon={DollarSign}
              variant="default"
            />
            <KpiCard
              label="CPL Médio"
              value={k.avgCpl !== null ? formatCurrency(k.avgCpl) : "—"}
              icon={TrendingUp}
              variant={k.avgCpl !== null ? "purple" : "default"}
              description="Custo por lead"
            />
            <KpiCard
              label="Campanhas Ativas"
              value={formatNumber(k.activeCampaigns)}
              icon={Megaphone}
              variant="default"
            />
          </div>
        </section>

        {/* ── Gráfico */}
        {data.hasData && data.lineData.length > 0 && (
          <section>
            <LeadsLineChart data={data.lineData} />
          </section>
        )}

        {/* ── Tabela */}
        {data.campaignRows.length > 0 && (
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Campanhas de Leads
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Performance no mês atual
              </p>
            </div>
            <CampaignTable rows={data.campaignRows} />
          </section>
        )}

        {data.campaignRows.length === 0 && data.hasData && (
          <div className="dash-card border-dashed border-2 border-border text-center py-10">
            <p className="text-muted-foreground text-sm">
              Nenhuma campanha de Leads cadastrada.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
