import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { CostRevenueChart, CampaignBarChart, ChannelPieChart } from "@/components/dashboard/Charts"
import { CampaignTable } from "@/components/campaigns/CampaignTable"
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart2,
  Target,
  Users,
} from "lucide-react"
import { formatCurrency, formatMultiplier } from "@/lib/utils"
import { getDashboardData } from "@/lib/dashboard-data"

export default async function DashboardPage() {
  const data = await getDashboardData()
  const k = data.kpis

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Visão geral de performance • ${data.periodLabel}`}
        totalSpend={k.totalCost}
        totalRevenue={k.totalRevenue}
      />

      <main className="flex-1 p-6 space-y-6">
        {/* ── Aviso de dados vazios */}
        {!data.hasData && (
          <div className="dash-card border-dashed border-2 border-border text-center py-10">
            <p className="text-muted-foreground text-sm">
              Nenhuma métrica encontrada para o período atual.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Sincronize os dados das plataformas para visualizar o dashboard.
            </p>
          </div>
        )}

        {/* ── KPI Cards */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              label="Investimento"
              value={formatCurrency(k.totalCost)}
              icon={DollarSign}
              variant="default"
            />
            <KpiCard
              label="Faturamento"
              value={formatCurrency(k.totalRevenue)}
              icon={TrendingUp}
              variant="green"
            />
            <KpiCard
              label="Lucro"
              value={formatCurrency(k.totalProfit)}
              icon={ShoppingCart}
              variant={k.totalProfit >= 0 ? "green" : "red"}
            />
            <KpiCard
              label="ROAS"
              value={k.roas !== null ? formatMultiplier(k.roas) : "—"}
              icon={BarChart2}
              variant="purple"
              description="Retorno sobre investimento"
            />
            <KpiCard
              label="CPA Médio"
              value={k.cpa !== null ? formatCurrency(k.cpa) : "—"}
              icon={Target}
              variant="default"
              description="Custo por aquisição"
            />
            <KpiCard
              label="CPL Médio"
              value={k.cpl !== null ? formatCurrency(k.cpl) : "—"}
              icon={Users}
              variant="default"
              description="Custo por lead"
            />
          </div>
        </section>

        {/* ── Gráficos */}
        {data.hasData && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CostRevenueChart data={data.lineData} />
              </div>
              <ChannelPieChart data={data.pieData} />
            </section>

            {data.barData.length > 0 && (
              <section>
                <CampaignBarChart data={data.barData} />
              </section>
            )}
          </>
        )}

        {/* ── Tabela de campanhas */}
        {data.campaignRows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Campanhas Ativas
              </h2>
              <a
                href="/campaigns"
                className="text-xs text-primary hover:underline"
              >
                Ver todas →
              </a>
            </div>
            <CampaignTable rows={data.campaignRows} />
          </section>
        )}
      </main>
    </div>
  )
}
