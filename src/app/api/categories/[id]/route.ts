// ============================================
// Category API Routes - PUT (update) & DELETE
// Scoped to authenticated user
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { updateCategorySchema, toCategoryResponse } from "@/lib/validations"
import { handleError, successResponse, NotFoundError } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const { id } = await params
    const body = await request.json()
    const validated = updateCategorySchema.parse(body)

    const existing = await db.category.findFirst({ where: { id, userId: auth.id } })
    if (!existing) throw new NotFoundError("Category", id)

    const category = await db.category.update({
      where: { id },
      data: validated,
    })

    return successResponse(toCategoryResponse(category))
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const { id } = await params

    const existing = await db.category.findFirst({
      where: { id, userId: auth.id },
      include: { _count: { select: { transactions: true } } },
    })
    if (!existing) throw new NotFoundError("Category", id)

    if (existing._count.transactions > 0) {
      return handleError(
        new Error(
          `Cannot delete category '${existing.name}' because it has ${existing._count.transactions} associated transactions.`
        )
      )
    }

    await db.category.delete({ where: { id } })

    return successResponse({ message: "Category deleted successfully" })
  } catch (error) {
    return handleError(error)
  }
}
