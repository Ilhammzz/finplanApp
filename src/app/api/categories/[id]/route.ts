// ============================================
// Category API Routes - PUT (update) & DELETE
// Equivalent: CategoryController in Spring Boot
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { updateCategorySchema, toCategoryResponse } from "@/lib/validations"
import { handleError, successResponse, NotFoundError } from "@/lib/api-utils"

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateCategorySchema.parse(body)

    const existing = await db.category.findUnique({ where: { id } })
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

// DELETE /api/categories/[id] - Delete a category (restricted if has transactions)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.category.findUnique({
      where: { id },
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
