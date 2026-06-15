// ============================================
// Seed Script - Default Categories for Finance Tracker
// NOTE: Categories are now auto-seeded when a user signs up.
// This script is kept for manual database seeding if needed.
// ============================================

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const expenseCategories = [
  { name: "Food & Dining", type: "EXPENSE", icon: "UtensilsCrossed" },
  { name: "Transportation", type: "EXPENSE", icon: "Car" },
  { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag" },
  { name: "Entertainment", type: "EXPENSE", icon: "Gamepad2" },
  { name: "Bills & Utilities", type: "EXPENSE", icon: "Receipt" },
  { name: "Health & Medical", type: "EXPENSE", icon: "Heart" },
  { name: "Education", type: "EXPENSE", icon: "GraduationCap" },
  { name: "Housing & Rent", type: "EXPENSE", icon: "Home" },
  { name: "Insurance", type: "EXPENSE", icon: "Shield" },
  { name: "Other Expense", type: "EXPENSE", icon: "MoreHorizontal" },
]

const incomeCategories = [
  { name: "Salary", type: "INCOME", icon: "Briefcase" },
  { name: "Freelance", type: "INCOME", icon: "Laptop" },
  { name: "Investment", type: "INCOME", icon: "TrendingUp" },
  { name: "Gift", type: "INCOME", icon: "Gift" },
  { name: "Other Income", type: "INCOME", icon: "MoreHorizontal" },
]

async function main() {
  console.log("🌱 Seeding database...")

  // Create a demo user
  const hashedPassword = await bcrypt.hash("password123", 12)
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@finance.com" },
    update: {},
    create: {
      email: "demo@finance.com",
      name: "Demo User",
      password: hashedPassword,
    },
  })

  console.log(`✅ Demo user created: ${demoUser.email}`)

  // Seed expense categories for demo user
  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { id: `seed-${demoUser.id}-expense-${cat.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${demoUser.id}-expense-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        userId: demoUser.id,
      },
    })
  }

  // Seed income categories for demo user
  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { id: `seed-${demoUser.id}-income-${cat.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${demoUser.id}-income-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        userId: demoUser.id,
      },
    })
  }

  // Seed a demo wallet
  await prisma.wallet.upsert({
    where: { id: `seed-${demoUser.id}-wallet-main` },
    update: {},
    create: {
      id: `seed-${demoUser.id}-wallet-main`,
      name: "Main Wallet",
      balance: 1000000, // Rp 1,000,000
      userId: demoUser.id,
    },
  })

  console.log("✅ Seed completed: Demo user, categories, and wallet created")
  console.log("📧 Demo login: demo@finance.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
