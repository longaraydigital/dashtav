import { PrismaClient, Platform, ObjectiveType, CampaignStatus, UserRole } from "@prisma/client"
import { subDays, startOfDay } from "date-fns"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // 1. Limpar dados existentes (ordem reversa de dependência)
  await prisma.syncLog.deleteMany()
  await prisma.dailyMetric.deleteMany()
  await prisma.campaignTarget.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.leadEconomics.deleteMany()
  await prisma.productEconomics.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.user.deleteMany()

  console.log("🧹 Banco limpo.")

  // 2. Usuário Administrador
  const hashedPassword = await bcrypt.hash("admin123", 10)
  await prisma.user.create({
    data: {
      name: "Admin Dash",
      email: "admin@dashtav.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  console.log("👤 Usuário admin criado: admin@dashtav.com / admin123")

  // 3. Integrações
  await prisma.integration.createMany({
    data: [
      { platform: Platform.META, status: "ACTIVE" },
      { platform: Platform.GOOGLE, status: "ACTIVE" },
    ],
  })

  // 3. Produtos e Economics
  // Produto A: Venda direta (Sales)
  const productSales = await prisma.productEconomics.create({
    data: {
      productName: "Produto Alpha — E-commerce",
      ticket: 297.00,
      marginPercent: 0.60, // 60% de margem bruta
      desiredProfitPercent: 0.20, // 20% de lucro final desejado
      breakEvenCpa: 178.20, // 297 * 0.6
      idealCpa: 118.80,    // 297 * (0.6 - 0.2)
    },
  })

  // Produto B: High Ticket / Consultoria (Leads)
  const productLeads = await prisma.productEconomics.create({
    data: {
      productName: "Mentoria TAV — High Ticket",
      ticket: 5000.00,
      marginPercent: 0.80,
      desiredProfitPercent: 0.30,
      breakEvenCpa: 4000.00,
      idealCpa: 2500.00,
      leadEconomics: {
        create: {
          leadToSaleRate: 0.05, // 5% de conversão de lead p/ venda
          breakEvenCpl: 200.00, // 4000 * 0.05
          idealCpl: 125.00,    // 2500 * 0.05
        },
      },
    },
  })

  // 4. Campanhas
  const campaignsData = [
    {
      name: "Meta — Produto Alpha — Conversão",
      platform: Platform.META,
      objectiveType: ObjectiveType.SALES,
      productId: productSales.id,
      status: CampaignStatus.ACTIVE,
      startDate: subDays(new Date(), 60),
      targets: {
        create: {
          monthlyBudgetPlanned: 15000,
          cpaTarget: 110,
          expectedSales: 136,
        },
      },
    },
    {
      name: "Google Ads — Alpha — Search",
      platform: Platform.GOOGLE,
      objectiveType: ObjectiveType.SALES,
      productId: productSales.id,
      status: CampaignStatus.ACTIVE,
      startDate: subDays(new Date(), 45),
      targets: {
        create: {
          monthlyBudgetPlanned: 8000,
          cpaTarget: 130,
          expectedSales: 60,
        },
      },
    },
    {
      name: "Meta — Mentoria — Leads Ebook",
      platform: Platform.META,
      objectiveType: ObjectiveType.LEADS,
      productId: productLeads.id,
      status: CampaignStatus.ACTIVE,
      startDate: subDays(new Date(), 30),
      targets: {
        create: {
          monthlyBudgetPlanned: 5000,
          cplTarget: 80,
          expectedLeads: 60,
        },
      },
    },
  ]

  const campaigns = []
  for (const cData of campaignsData) {
    const c = await prisma.campaign.create({
      data: cData,
    })
    campaigns.push(c)
  }

  // 5. Métricas Diárias (últimos 30 dias)
  console.log("📊 Gerando métricas diárias...")
  const today = startOfDay(new Date())
  const metrics = []

  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i)

    for (const c of campaigns) {
      let cost, leads = 0, sales = 0, revenue = 0

      if (c.platform === Platform.META && c.objectiveType === ObjectiveType.SALES) {
        cost = 300 + Math.random() * 250
        sales = Math.floor(cost / (90 + Math.random() * 40))
        revenue = sales * 297
      } else if (c.platform === Platform.GOOGLE) {
        cost = 200 + Math.random() * 150
        sales = Math.floor(cost / (120 + Math.random() * 50))
        revenue = sales * 297
      } else {
        // Leads
        cost = 150 + Math.random() * 100
        leads = Math.floor(cost / (60 + Math.random() * 30))
      }

      metrics.push({
        date,
        campaignId: c.id,
        platform: c.platform,
        impressions: Math.floor(cost * 50),
        clicks: Math.floor(cost * 2),
        cost: Number(cost.toFixed(2)),
        leads,
        sales,
        revenue: Number(revenue.toFixed(2)),
        // Métricas simplificadas para o seed
        ctr: 0.02,
        roas: cost > 0 ? revenue / cost : 0,
      })
    }
  }

  await prisma.dailyMetric.createMany({ data: metrics })

  console.log(`✅ Seed finalizado! Criados: 2 produtos, ${campaigns.length} campanhas e ${metrics.length} entradas de métricas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
