// ============================================
// DTO Exports - Central import point
// ============================================

export {
  createWalletSchema,
  updateWalletSchema,
  toWalletResponse,
  type CreateWalletRequest,
  type UpdateWalletRequest,
  type WalletResponse,
} from "./wallet"

export {
  TransactionType,
  createCategorySchema,
  updateCategorySchema,
  toCategoryResponse,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type CategoryResponse,
} from "./category"

export {
  createTransactionSchema,
  updateTransactionSchema,
  transactionSearchSchema,
  toTransactionResponse,
  type CreateTransactionRequest,
  type UpdateTransactionRequest,
  type TransactionResponse,
  type TransactionSearchParams,
  type PaginatedTransactionResponse,
  type DashboardSummary,
  type DashboardMonthlySummary,
} from "./transaction"
