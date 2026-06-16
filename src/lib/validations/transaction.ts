// ============================================
// Transaction DTOs (Data Transfer Objects)
// Separates API contract from database entity
// ============================================

import { z } from "zod"
import type { Transaction } from "@prisma/client"
import { TransactionType } from "./category"

// --- Transaction Request DTOs ---

export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"], { required_error: "Transaction type is required" }),
  description: z.string().max(500, "Description too long").optional(),
  transactionDate: z.string().min(1, "Transaction date is required"), // YYYY-MM-DD
  walletId: z.string().min(1, "Wallet is required"),
  categoryId: z.string().min(1, "Category is required"),
})

export const updateTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  description: z.string().max(500, "Description too long").optional(),
  transactionDate: z.string().min(1, "Transaction date is required").optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
})

export type CreateTransactionRequest = z.infer<typeof createTransactionSchema>
export type UpdateTransactionRequest = z.infer<typeof updateTransactionSchema>

// --- Transaction Response DTOs ---

export interface TransactionResponse {
  id: string
  amount: number
  type: TransactionType
  description: string | null
  transactionDate: string
  walletId: string
  walletName: string
  categoryId: string
  categoryName: string
  categoryType: TransactionType
  categoryIcon: string | null
  createdAt: string
  updatedAt: string
}

// --- Transaction Search/Filter DTOs ---

export const transactionSearchSchema = z.object({
  startDate: z.string().optional(),     // YYYY-MM-DD
  endDate: z.string().optional(),       // YYYY-MM-DD
  walletId: z.string().optional(),      // Filter by wallet
  type: z.enum(["INCOME", "EXPENSE"]).optional(), // Filter by type
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type TransactionSearchParams = z.infer<typeof transactionSearchSchema>

export interface PaginatedTransactionResponse {
  data: TransactionResponse[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

// --- Dashboard Summary DTOs ---

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  walletCount: number
  transactionCount: number
}

export interface DashboardMonthlySummary {
  month: string       // YYYY-MM
  income: number
  expense: number
  net: number
}

// --- Transaction Transformer (Entity -> DTO) ---

type TransactionWithRelations = Transaction & {
  wallet: { id: string; name: string }
  category: { id: string; name: string; type: string; icon: string | null }
}

export function toTransactionResponse(tx: TransactionWithRelations): TransactionResponse {
  return {
    id: tx.id,
    amount: tx.amount,
    type: tx.type as TransactionType,
    description: tx.description,
    transactionDate: tx.transactionDate,
    walletId: tx.walletId,
    walletName: tx.wallet.name,
    categoryId: tx.categoryId,
    categoryName: tx.category.name,
    categoryType: tx.category.type as TransactionType,
    categoryIcon: tx.category.icon,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  }
}
