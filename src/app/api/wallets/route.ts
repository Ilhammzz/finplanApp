// ============================================
// Wallet API Routes - GET (list all) & POST (create)
// Scoped to authenticated user
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createWalletSchema, toWalletResponse } from "@/lib/validations"
import { handleError, successResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"

// GET /api/wallets - List all wallets for current user
export async function GET() {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth // Unauthorized response

    const wallets = await db.wallet.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { transactions: true } },
      },
    })

    const data = wallets.map((w) => ({
      ...toWalletResponse(w),
      transactionCount: w._count.transactions,
    }))

    return successResponse(data)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/wallets - Create a new wallet
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const body = await request.json()
    const validated = createWalletSchema.parse(body)

    const wallet = await db.wallet.create({
      data: {
        name: validated.name,
        balance: validated.balance,
        userId: auth.id,
      },
    })

    return successResponse(toWalletResponse(wallet), 201)
  } catch (error) {
    return handleError(error)
  }
}
