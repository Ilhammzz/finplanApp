// ============================================
// Dashboard Summary API Route - GET
// Scoped to authenticated user
// ============================================

import { db } from "@/lib/db"
import { handleError, successResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"
import type { DashboardSummary } from "@/lib/validations"

export async function GET() {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const [wallets, incomeResult, expenseResult, transactionCount] = await Promise.all([
      db.wallet.findMany({ where: { userId: auth.id }, select: { balance: true } }),
      db.transaction.aggregate({ where: { userId: auth.id, type: "INCOME" }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId: auth.id, type: "EXPENSE" }, _sum: { amount: true } }),
      db.transaction.count({ where: { userId: auth.id } }),
    ])

    const totalIncome = incomeResult._sum.amount || 0
    const totalExpense = expenseResult._sum.amount || 0
    const netBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

    const summary: DashboardSummary = {
      totalIncome,
      totalExpense,
      netBalance,
      walletCount: wallets.length,
      transactionCount,
    }

    return successResponse(summary)
  } catch (error) {
    return handleError(error)
  }
}
