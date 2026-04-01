"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/utils"

interface LeadEconomics {
  leadToSaleRate: number
  idealCpl: number | null
  breakEvenCpl: number | null
}

export interface ProductRow {
  id: string
  productName: string
  ticket: number
  marginPercent: number
  desiredProfitPercent: number
  breakEvenCpa: number | null
  idealCpa: number | null
  leadEconomics: LeadEconomics | null
  campaignCount: number
}

interface ProductsClientProps {
  products: ProductRow[]
}

const INITIAL_FORM = {
  productName: "",
  ticket: "",
  marginPercent: "",
  desiredProfitPercent: "",
  hasLeads: false,
  leadToSaleRate: "",
}

export function ProductsClient({ products }: ProductsClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)

    const ticket               = parseFloat(form.ticket)
    const marginPercent        = parseFloat(form.marginPercent) / 100
    const desiredProfitPercent = parseFloat(form.desiredProfitPercent) / 100

    if (isNaN(ticket) || isNaN(marginPercent) || isNaN(desiredProfitPercent)) {
      setError("Preencha todos os campos numéricos corretamente.")
      setSaving(false)
      return
    }

    const body: Record<string, unknown> = {
      productName: form.productName,
      ticket,
      marginPercent,
      desiredProfitPercent,
    }

    if (form.hasLeads) {
      const rate = parseFloat(form.leadToSaleRate) / 100
      if (isNaN(rate)) {
        setError("Taxa de conversão lead → venda inválida.")
        setSaving(false)
        return
      }
      body.leadEconomics = { leadToSaleRate: rate }
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setForm(INITIAL_FORM)
      setShowForm(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data?.error ?? "Erro ao criar produto.")
    }
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deletar "${name}"? As campanhas vinculadas perderão os dados econômicos.`)) return
    setDeleting(id)
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      {/* Botão de criar */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm((v) => !v); setError("") }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <form onSubmit={handleCreate} className="dash-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Novo Produto</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Nome do Produto</label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="Ex: Mentoria TAV — High Ticket"
                className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ticket (R$)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.ticket}
                onChange={(e) => setForm({ ...form, ticket: e.target.value })}
                placeholder="297.00"
                className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Margem (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                value={form.marginPercent}
                onChange={(e) => setForm({ ...form, marginPercent: e.target.value })}
                placeholder="60"
                className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground/60 mt-0.5">Margem bruta do produto</p>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Lucro desejado (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                value={form.desiredProfitPercent}
                onChange={(e) => setForm({ ...form, desiredProfitPercent: e.target.value })}
                placeholder="20"
                className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground/60 mt-0.5">Abaixo da margem</p>
            </div>
          </div>

          {/* Leads toggle */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasLeads}
                onChange={(e) => setForm({ ...form, hasLeads: e.target.checked })}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Este produto usa campanhas de Leads</span>
            </label>

            {form.hasLeads && (
              <div className="mt-3 ml-6">
                <label className="block text-xs text-muted-foreground mb-1">
                  Taxa lead → venda (%)
                </label>
                <input
                  type="number"
                  required={form.hasLeads}
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.leadToSaleRate}
                  onChange={(e) => setForm({ ...form, leadToSaleRate: e.target.value })}
                  placeholder="10"
                  className="w-full max-w-xs px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Ex: 10% = a cada 10 leads, 1 venda
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-[hsl(var(--perf-red))]">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); setForm(INITIAL_FORM) }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando…" : "Criar Produto"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de produtos */}
      {products.length === 0 ? (
        <div className="dash-card border-dashed border-2 border-border text-center py-16">
          <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum produto cadastrado.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Crie um produto para definir CPA e CPL ideais nas campanhas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const isExpanded = expandedId === p.id
            return (
              <div key={p.id} className="dash-card p-0 overflow-hidden">
                {/* Cabeçalho do card */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleExpand(p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ticket {formatCurrency(p.ticket)} ·{" "}
                      {p.campaignCount} campanha{p.campaignCount !== 1 ? "s" : ""}
                      {p.leadEconomics && " · tem leads"}
                    </p>
                  </div>

                  {/* Métricas rápidas */}
                  <div className="hidden sm:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">CPA Ideal</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {p.idealCpa !== null ? formatCurrency(p.idealCpa) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Break-even</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {p.breakEvenCpa !== null ? formatCurrency(p.breakEvenCpa) : "—"}
                      </p>
                    </div>
                  </div>

                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Stat label="Ticket" value={formatCurrency(p.ticket)} />
                      <Stat label="Margem" value={formatPercent(p.marginPercent)} />
                      <Stat label="Lucro desejado" value={formatPercent(p.desiredProfitPercent)} />
                      <Stat label="Margem bruta (R$)" value={formatCurrency(p.ticket * p.marginPercent)} />
                      <Stat label="CPA Ideal" value={p.idealCpa !== null ? formatCurrency(p.idealCpa) : "—"} highlight />
                      <Stat label="CPA Break-even" value={p.breakEvenCpa !== null ? formatCurrency(p.breakEvenCpa) : "—"} />
                    </div>

                    {p.leadEconomics && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Economics de Leads
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <Stat label="Taxa lead→venda" value={formatPercent(p.leadEconomics.leadToSaleRate)} />
                          <Stat
                            label="CPL Ideal"
                            value={p.leadEconomics.idealCpl !== null ? formatCurrency(p.leadEconomics.idealCpl) : "—"}
                            highlight
                          />
                          <Stat
                            label="CPL Break-even"
                            value={p.leadEconomics.breakEvenCpl !== null ? formatCurrency(p.leadEconomics.breakEvenCpl) : "—"}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-border/50">
                      <button
                        onClick={() => handleDelete(p.id, p.productName)}
                        disabled={deleting === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[hsl(var(--perf-red))]/70 hover:text-[hsl(var(--perf-red))] hover:bg-[hsl(var(--perf-red))]/10 rounded-md transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting === p.id ? "Deletando…" : "Deletar produto"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
