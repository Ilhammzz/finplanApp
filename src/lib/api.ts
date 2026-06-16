// ============================================
// API Service Layer - Frontend communication with Backend
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
    const message = json.error?.message || "API request failed"
    const code = json.error?.code
    // If unauthorized, throw a special error
    if (code === "UNAUTHORIZED" || res.status === 401) {
      throw new Error("UNAUTHORIZED")
    }
    throw new Error(message)
  }

  return json.data as T
}

// --- Auth API ---

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    apiFetch<{ id: string; name: string; email: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    apiFetch<{ message: string; token?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; password: string }) =>
    apiFetch<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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

// --- Dashboard API ---

export const dashboardApi = {
  summary: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
  search: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    return apiFetch<PaginatedTransactionResponse>(`/api/transactions/search?${qs}`)
  },
}
