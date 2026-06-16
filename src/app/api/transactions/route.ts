// ============================================
// Transaction API Route - POST (create with balance adjustment)
// Scoped to authenticated user
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createTransactionSchema, toTransactionResponse } from "@/lib/validations"
import { handleError, successResponse, NotFoundError, InsufficientBalanceError } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"

// POST /api/transactions - Create a transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const body = await request.json()
    const validated = createTransactionSchema.parse(body)

    // Verify wallet belongs to user
    const wallet = await db.wallet.findFirst({
      where: { id: validated.walletId, userId: auth.id },
    })
    if (!wallet) throw new NotFoundError("Wallet", validated.walletId)

    // Verify category belongs to user and type matches
    const category = await db.category.findFirst({
      where: { id: validated.categoryId, userId: auth.id },
    })
    if (!category) throw new NotFoundError("Category", validated.categoryId)

    if (category.type !== validated.type) {
      return handleError(
        new Error(
          `Category '${category.name}' is of type ${category.type}, but transaction type is ${validated.type}. They must match.`
        )
      )
    }

    // Check sufficient balance for EXPENSE
    if (validated.type === "EXPENSE" && wallet.balance < validated.amount) {
      throw new InsufficientBalanceError(wallet.name, wallet.balance, validated.amount)
    }

    // Execute transaction + balance update atomically
    const transaction = await db.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          amount: validated.amount,
          type: validated.type,
          description: validated.description,
          transactionDate: validated.transactionDate,
          walletId: validated.walletId,
          categoryId: validated.categoryId,
          userId: auth.id,
        },
        include: {
          wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true, icon: true } },
        },
      })

      const balanceChange = validated.type === "INCOME" ? validated.amount : -validated.amount
      await tx.wallet.update({
        where: { id: validated.walletId },
        data: { balance: { increment: balanceChange } },
      })

      return newTx
    })

    return successResponse(toTransactionResponse(transaction), 201)
  } catch (error) {
    return handleError(error)
  }
}
