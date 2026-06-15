// ============================================
// Seed Script - Default Categories for Finance Tracker
// Run with: bunx prisma db seed
// ============================================

import { PrismaClient } from "@prisma/client"

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

  // Seed expense categories
  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { id: `seed-expense-${cat.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-expense-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
      },
    })
  }

  // Seed income categories
  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { id: `seed-income-${cat.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-income-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
      },
    })
  }

  // Seed a default wallet
  await prisma.wallet.upsert({
    where: { id: "seed-wallet-main" },
    update: {},
    create: {
      id: "seed-wallet-main",
      name: "Main Wallet",
      balance: 0,
    },
  })

  console.log("✅ Seed completed: Default categories and wallet created")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
