"use client"

import { useState } from "react"
import { User, Lock, Shield } from "lucide-react"

interface SettingsClientProps {
  user: {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "VIEWER"
    createdAt: string
  }
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN:  "Administrador",
  VIEWER: "Visualizador",
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [name, setName]             = useState(user.name ?? "")
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg]       = useState("")

  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd]         = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdSaving, setPwdSaving]   = useState(false)
  const [pwdMsg, setPwdMsg]         = useState("")
  const [pwdError, setPwdError]     = useState("")

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg("")
    setNameSaving(true)

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      setNameMsg("Nome atualizado com sucesso.")
    } else {
      setNameMsg("Erro ao atualizar nome.")
    }
    setNameSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg("")
    setPwdError("")

    if (newPwd !== confirmPwd) {
      setPwdError("As senhas não coincidem.")
      return
    }
    if (newPwd.length < 8) {
      setPwdError("A nova senha deve ter ao menos 8 caracteres.")
      return
    }

    setPwdSaving(true)
    const res = await fetch("/api/users/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    })

    if (res.ok) {
      setPwdMsg("Senha alterada com sucesso.")
      setCurrentPwd("")
      setNewPwd("")
      setConfirmPwd("")
    } else {
      const data = await res.json()
      setPwdError(data?.error ?? "Erro ao alterar senha.")
    }
    setPwdSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Informações da conta */}
      <div className="dash-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="w-4 h-4 text-primary" />
          Informações da Conta
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-foreground mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Perfil</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <p className="text-sm text-foreground">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Membro desde</p>
            <p className="text-sm text-foreground mt-0.5">
              {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Editar nome */}
      <form onSubmit={handleSaveName} className="dash-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="w-4 h-4 text-primary" />
          Nome de Exibição
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {nameMsg && (
          <p className="text-xs text-[hsl(var(--perf-green))]">{nameMsg}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={nameSaving || !name.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {nameSaving ? "Salvando…" : "Salvar Nome"}
          </button>
        </div>
      </form>

      {/* Alterar senha */}
      <form onSubmit={handleChangePassword} className="dash-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="w-4 h-4 text-primary" />
          Alterar Senha
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Senha Atual</label>
            <input
              type="password"
              required
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nova Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground/60 mt-0.5">Mínimo 8 caracteres</p>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {pwdError && (
          <p className="text-xs text-[hsl(var(--perf-red))]">{pwdError}</p>
        )}
        {pwdMsg && (
          <p className="text-xs text-[hsl(var(--perf-green))]">{pwdMsg}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pwdSaving ? "Alterando…" : "Alterar Senha"}
          </button>
        </div>
      </form>
    </div>
  )
}
