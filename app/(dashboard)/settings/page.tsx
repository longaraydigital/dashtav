import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings/SettingsClient"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (!user) redirect("/login")

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Configurações"
        subtitle="Perfil e preferências da conta"
      />

      <main className="flex-1 p-6">
        <SettingsClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
          }}
        />
      </main>
    </div>
  )
}
