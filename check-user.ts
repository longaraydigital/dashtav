import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log(`Total de usuários: ${users.length}`)
  
  if (users.length > 0) {
    const user = users[0]
    console.log(`Email: ${user.email}`)
    console.log(`Senha hasheada existe? ${!!user.password}`)
    
    // Testar se 'admin123' funciona
    const isValid = await bcrypt.compare("admin123", user.password)
    console.log(`Senha admin123 bate com hash? ${isValid}`)
  } else {
    console.log("Nenhum usuário encontrado no banco. Precisamos rodar o seed!")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
