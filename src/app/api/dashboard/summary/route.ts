// ============================================
// Dashboard Summary API Route - GET (summary statistics)
// Returns total income, expense, net balance, wallet count, transaction count
// ============================================

import { db } from "@/lib/db"
import { handleError, successResponse } from "@/lib/api-utils"
import type { DashboardSummary } from "@/lib/validations"

// GET /api/dashboard/summary - Get dashboard summary
export async function GET() {
  try {
    const [wallets, incomeResult, expenseResult, transactionCount] = await Promise.all([
      db.wallet.findMany({ select: { balance: true } }),
      db.transaction.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
      db.transaction.count(),
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
