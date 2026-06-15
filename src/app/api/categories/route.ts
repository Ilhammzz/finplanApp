// ============================================
// Category API Routes - GET (list all) & POST (create)
// Scoped to authenticated user
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createCategorySchema, toCategoryResponse } from "@/lib/validations"
import { handleError, successResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"

// GET /api/categories - List categories (optionally filter by type)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "INCOME" or "EXPENSE"

    const where: Record<string, unknown> = { userId: auth.id }
    if (type) where.type = type

    const categories = await db.category.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { transactions: true } },
      },
    })

    const data = categories.map((c) => ({
      ...toCategoryResponse(c),
      transactionCount: c._count.transactions,
    }))

    return successResponse(data)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const body = await request.json()
    const validated = createCategorySchema.parse(body)

    const category = await db.category.create({
      data: {
        name: validated.name,
        type: validated.type,
        icon: validated.icon,
        userId: auth.id,
      },
    })

    return successResponse(toCategoryResponse(category), 201)
  } catch (error) {
    return handleError(error)
  }
}
