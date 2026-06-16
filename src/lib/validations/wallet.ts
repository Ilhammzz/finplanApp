// ============================================
// Wallet DTOs (Data Transfer Objects)
// Separates API contract from database entity
// ============================================

import { z } from "zod"
import type { Wallet } from "@prisma/client"

// --- Wallet Request DTOs ---

export const createWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(100, "Wallet name too long"),
  balance: z.number().min(0, "Initial balance cannot be negative").default(0),
})

export const updateWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(100, "Wallet name too long").optional(),
})

export type CreateWalletRequest = z.infer<typeof createWalletSchema>
export type UpdateWalletRequest = z.infer<typeof updateWalletSchema>

// --- Wallet Response DTOs ---

export interface WalletResponse {
  id: string
  name: string
  balance: number
  createdAt: string
  updatedAt: string
}

// --- Wallet Transformer (Entity -> DTO) ---

export function toWalletResponse(wallet: Wallet): WalletResponse {
  return {
    id: wallet.id,
    name: wallet.name,
    balance: wallet.balance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  }
}
