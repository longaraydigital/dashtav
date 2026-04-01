import { NextRequest } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, err, serverError } from "@/lib/api"
import bcrypt from "bcryptjs"

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
})

// GET /api/users/me
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return err("Não autenticado", 401)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) return err("Usuário não encontrado", 404)

    return ok(user)
  } catch (e) {
    return serverError(e)
  }
}

// PUT /api/users/me — atualiza nome
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return err("Não autenticado", 401)

    const body   = await req.json()
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) return err("Dados inválidos", 422, parsed.error.flatten())

    const user = await prisma.user.update({
      where: { id: session.user.id as string },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true, role: true },
    })

    return ok(user)
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/users/me/password — troca senha
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return err("Não autenticado", 401)

    const body   = await req.json()
    const parsed = ChangePasswordSchema.safeParse(body)
    if (!parsed.success) return err("Dados inválidos", 422, parsed.error.flatten())

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
    })
    if (!user) return err("Usuário não encontrado", 404)

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
    if (!valid) return err("Senha atual incorreta", 400)

    const hashed = await bcrypt.hash(parsed.data.newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return ok({ updated: true })
  } catch (e) {
    return serverError(e)
  }
}
