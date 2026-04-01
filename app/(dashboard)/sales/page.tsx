import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { CostRevenueChart, CampaignBarChart } from "@/components/dashboard/Charts"
import { CampaignTable } from "@/components/campaigns/CampaignTable"
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart2,
  Target,
  Megaphone,
} from "lucide-react"
import { formatCurrency, formatNumber, formatMultiplier } from "@/lib/utils"
import { getSalesData } from "@/lib/sales-data"

export default async function SalesPage() {
  const data = await getSalesData()
  const k    = data.kpis

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Vendas"
        subtitle={`Performance de conversão · ${data.periodLabel}`}
        totalSpend={k.totalCost}
        totalRevenue={k.totalRevenue}
      />

      <main className="flex-1 p-6 space-y-6">
        {!data.hasData && (
          <div className="dash-card border-dashed border-2 border-border text-center py-10">
            <p className="text-muted-foreground text-sm">
              Nenhum dado de vendas encontrado para o período atual.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Sincronize as plataformas ou crie campanhas com objetivo Vendas.
            </p>
          </div>
        )}

        {/* ── KPI Cards */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              label="Vendas"
              value={formatNumber(k.totalSales)}
              icon={ShoppingCart}
              variant="green"
            />
            <KpiCard
              label="Faturamento"
              value={formatCurrency(k.totalRevenue)}
              icon={TrendingUp}
              variant="green"
            />
            <KpiCard
              label="Investimento"
              value={formatCurrency(k.totalCost)}
              icon={DollarSign}
              variant="default"
            />
            <KpiCard
              label="Lucro"
              value={formatCurrency(k.totalProfit)}
              icon={DollarSign}
              variant={k.totalProfit >= 0 ? "green" : "red"}
            />
            <KpiCard
              label="CPA Médio"
              value={k.avgCpa !== null ? formatCurrency(k.avgCpa) : "—"}
              icon={Target}
              variant="default"
              description="Custo por aquisição"
            />
            <KpiCard
              label="ROAS Médio"
              value={k.avgRoas !== null ? formatMultiplier(k.avgRoas) : "—"}
              icon={BarChart2}
              variant="purple"
              description="Retorno sobre investimento"
            />
          </div>
        </section>

        {/* ── Gráficos */}
        {data.hasData && (
          <>
            {data.lineData.length > 0 && (
              <section>
                <CostRevenueChart data={data.lineData} />
              </section>
            )}

            {data.barData.length > 0 && (
              <section>
                <CampaignBarChart data={data.barData} />
              </section>
            )}
          </>
        )}

        {/* ── Tabela */}
        {data.campaignRows.length > 0 && (
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Campanhas de Vendas
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
              Nenhuma campanha de Vendas cadastrada.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
