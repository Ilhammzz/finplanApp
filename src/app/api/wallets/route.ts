// ============================================
// Wallet API Routes - GET (list all) & POST (create)
// Equivalent: WalletController in Spring Boot
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createWalletSchema, toWalletResponse } from "@/lib/validations"
import { handleError, successResponse } from "@/lib/api-utils"

// GET /api/wallets - List all wallets
export async function GET() {
  try {
    const wallets = await db.wallet.findMany({
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
    const body = await request.json()
    const validated = createWalletSchema.parse(body)

    const wallet = await db.wallet.create({
      data: {
        name: validated.name,
        balance: validated.balance,
      },
    })

    return successResponse(toWalletResponse(wallet), 201)
  } catch (error) {
    return handleError(error)
  }
}
