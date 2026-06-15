// ============================================
// API Service Layer - Frontend communication with Backend
// Equivalent: Axios service in Spring Boot + React setup
// ============================================

import type {
  WalletResponse,
  CategoryResponse,
  TransactionResponse,
  DashboardSummary,
  PaginatedTransactionResponse,
} from "@/lib/validations"

// --- Generic Fetch Helper ---

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error?.message || "API request failed")
  }

  return json.data as T
}

// --- Wallet API ---

export const walletApi = {
  list: () => apiFetch<(WalletResponse & { transactionCount: number })[]>("/api/wallets"),

  create: (data: { name: string; balance?: number }) =>
    apiFetch<WalletResponse>("/api/wallets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string }) =>
    apiFetch<WalletResponse>(`/api/wallets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/wallets/${id}`, {
      method: "DELETE",
    }),
}

// --- Category API ---

export const categoryApi = {
  list: (type?: "INCOME" | "EXPENSE") =>
    apiFetch<(CategoryResponse & { transactionCount: number })[]>(
      `/api/categories${type ? `?type=${type}` : ""}`
    ),

  create: (data: { name: string; type: "INCOME" | "EXPENSE"; icon?: string }) =>
    apiFetch<CategoryResponse>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; icon?: string }) =>
    apiFetch<CategoryResponse>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/categories/${id}`, {
      method: "DELETE",
    }),
}

// --- Transaction API ---

export const transactionApi = {
  create: (data: {
    amount: number
    type: "INCOME" | "EXPENSE"
    description?: string
    transactionDate: string
    walletId: string
    categoryId: string
  }) =>
    apiFetch<TransactionResponse>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// --- Dashboard API (Phase 3 preview) ---

export const dashboardApi = {
  summary: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
  search: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    return apiFetch<PaginatedTransactionResponse>(`/api/transactions/search?${qs}`)
  },
}
