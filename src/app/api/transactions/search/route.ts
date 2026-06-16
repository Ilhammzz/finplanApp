// ============================================
// Transaction Search API Route - GET
// Scoped to authenticated user
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { transactionSearchSchema, toTransactionResponse } from "@/lib/validations"
import { handleError, successResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ("json" in auth) return auth

    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get("type")
    const params = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      walletId: searchParams.get("walletId") || undefined,
      type: (typeParam === "INCOME" || typeParam === "EXPENSE") ? typeParam : undefined,
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
    }

    const validated = transactionSearchSchema.parse(params)

    const where: Record<string, unknown> = { userId: auth.id }
    if (validated.type) where.type = validated.type
    if (validated.walletId) where.walletId = validated.walletId
    if (validated.startDate || validated.endDate) {
      where.transactionDate = {}
      if (validated.startDate) (where.transactionDate as Record<string, unknown>).gte = validated.startDate
      if (validated.endDate) (where.transactionDate as Record<string, unknown>).lte = validated.endDate
    }

    const [transactions, totalItems] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (validated.page - 1) * validated.pageSize,
        take: validated.pageSize,
        include: {
          wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true, icon: true } },
        },
      }),
      db.transaction.count({ where }),
    ])

    const data = transactions.map(toTransactionResponse)
    const totalPages = Math.ceil(totalItems / validated.pageSize)

    return successResponse({
      data,
      pagination: {
        page: validated.page,
        pageSize: validated.pageSize,
        totalItems,
        totalPages,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
