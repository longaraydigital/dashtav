"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency, formatNumber } from "@/lib/utils"

// ─────────────────────────────────────────
// TOOLTIP CUSTOMIZADO
// ─────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {typeof entry.value === "number" && entry.value > 100
              ? formatCurrency(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────
// GRÁFICO DE LINHA — Custo vs Faturamento
// ─────────────────────────────────────────

export interface LineChartData {
  date: string
  custo: number
  faturamento: number
}

export function CostRevenueChart({ data }: { data: LineChartData[] }) {
  return (
    <div className="dash-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Custo vs Faturamento
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="custo"
            name="Custo"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="faturamento"
            name="Faturamento"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────
// GRÁFICO DE BARRA — Performance por campanha
// ─────────────────────────────────────────

export interface BarChartData {
  name: string
  cpa: number
  meta: number
}

export function CampaignBarChart({ data }: { data: BarChartData[] }) {
  return (
    <div className="dash-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        CPA por Campanha
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
          <Bar dataKey="cpa" name="CPA Real" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="meta" name="Meta" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────
// GRÁFICO DE PIZZA — Distribuição por canal
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// GRÁFICO DE LINHA — Leads por dia
// ─────────────────────────────────────────

export interface LeadsLineData {
  date: string
  leads: number
  custo: number
}

export function LeadsLineChart({ data }: { data: LeadsLineData[] }) {
  return (
    <div className="dash-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Leads e Custo por Dia
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="custo"
            name="Custo"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface PieChartData {
  name: string
  value: number
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-2))",
]

export function ChannelPieChart({ data }: { data: PieChartData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="dash-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Distribuição por Canal
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${formatCurrency(value)} (${((value / total) * 100).toFixed(1)}%)`,
              "",
            ]}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
