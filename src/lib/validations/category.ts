// ============================================
// Category DTOs (Data Transfer Objects)
// Separates API contract from database entity
// ============================================

import { z } from "zod"
import type { Category } from "@prisma/client"

// --- Category Enums ---

export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

// --- Category Request DTOs ---

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long"),
  type: z.enum(["INCOME", "EXPENSE"], { required_error: "Category type is required" }),
  icon: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long").optional(),
  icon: z.string().optional(),
})

export type CreateCategoryRequest = z.infer<typeof createCategorySchema>
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>

// --- Category Response DTOs ---

export interface CategoryResponse {
  id: string
  name: string
  type: TransactionType
  icon: string | null
  createdAt: string
  updatedAt: string
}

// --- Category Transformer (Entity -> DTO) ---

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    type: category.type as TransactionType,
    icon: category.icon,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }
}
