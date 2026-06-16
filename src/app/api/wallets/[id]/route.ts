// ============================================
// Wallet API Routes - PUT (update) & DELETE
// Scoped to authenticated user
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { updateWalletSchema, toWalletResponse } from "@/lib/validations"
import { handleError, successResponse, NotFoundError } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"

// PUT /api/wallets/[id] - Update a wallet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const { id } = await params
    const body = await request.json()
    const validated = updateWalletSchema.parse(body)

    const existing = await db.wallet.findFirst({ where: { id, userId: auth.id } })
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

// DELETE /api/wallets/[id] - Delete a wallet
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const { id } = await params

    const existing = await db.wallet.findFirst({ where: { id, userId: auth.id } })
    if (!existing) throw new NotFoundError("Wallet", id)

    await db.wallet.delete({ where: { id } })

    return successResponse({ message: "Wallet deleted successfully" })
  } catch (error) {
    return handleError(error)
  }
}
