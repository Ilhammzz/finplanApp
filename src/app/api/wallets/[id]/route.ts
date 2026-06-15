// ============================================
// Wallet API Routes - PUT (update) & DELETE
// Equivalent: WalletController in Spring Boot
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { updateWalletSchema, toWalletResponse } from "@/lib/validations"
import { handleError, successResponse, NotFoundError } from "@/lib/api-utils"

// PUT /api/wallets/[id] - Update a wallet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateWalletSchema.parse(body)

    const existing = await db.wallet.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError("Wallet", id)

    const wallet = await db.wallet.update({
      where: { id },
      data: validated,
    })

    return successResponse(toWalletResponse(wallet))
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/wallets/[id] - Delete a wallet (cascades transactions)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.wallet.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError("Wallet", id)

    await db.wallet.delete({ where: { id } })

    return successResponse({ message: "Wallet deleted successfully" })
  } catch (error) {
    return handleError(error)
  }
}
