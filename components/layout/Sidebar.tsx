"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Megaphone,
  Users,
  ShoppingCart,
  Package,
  Plug,
  Settings,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Campanhas",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    label: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    label: "Vendas",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    label: "Produtos",
    href: "/products",
    icon: Package,
  },
  {
    label: "Integrações",
    href: "/integrations",
    icon: Plug,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-30"
      style={{
        width: "var(--sidebar-width)",
        background: "hsl(var(--sidebar-bg))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold tracking-wider text-white uppercase">
          Dash TAV
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary/15 text-white"
                  : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--secondary))] hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-[hsl(var(--sidebar-fg))] group-hover:text-primary/80"
                )}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-subtle" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <p className="text-xs text-[hsl(var(--sidebar-fg))]">v0.1.0</p>
      </div>
    </aside>
  )
}
