// ============================================
// Transaction API Route - POST (create with balance adjustment)
// Equivalent: TransactionService with @Transactional in Spring Boot
//
// Business Logic:
//   INCOME  -> Add amount to wallet balance
//   EXPENSE -> Deduct amount from wallet balance
//   Throws if wallet not found or insufficient balance for EXPENSE
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createTransactionSchema, toTransactionResponse } from "@/lib/validations"
import { handleError, successResponse, NotFoundError, InsufficientBalanceError } from "@/lib/api-utils"
import { Prisma } from "@prisma/client"

// POST /api/transactions - Create a transaction (with balance adjustment)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createTransactionSchema.parse(body)

    // Verify wallet exists
    const wallet = await db.wallet.findUnique({ where: { id: validated.walletId } })
    if (!wallet) throw new NotFoundError("Wallet", validated.walletId)

    // Verify category exists and type matches
    const category = await db.category.findUnique({ where: { id: validated.categoryId } })
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

    // Execute transaction + balance update atomically (equivalent to @Transactional)
    const transaction = await db.$transaction(async (tx) => {
      // Create the transaction record
      const newTx = await tx.transaction.create({
        data: {
          amount: validated.amount,
          type: validated.type,
          description: validated.description,
          transactionDate: validated.transactionDate,
          walletId: validated.walletId,
          categoryId: validated.categoryId,
        },
        include: {
          wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true, icon: true } },
        },
      })

      // Update wallet balance
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
