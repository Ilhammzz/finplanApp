'use client'

import { useState, useEffect, useCallback } from "react"
import {
  Wallet, Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  DollarSign, ArrowUpRight, ArrowDownRight, CalendarDays,
  UtensilsCrossed, Car, ShoppingBag, Gamepad2, Receipt, Heart,
  GraduationCap, Home as HomeIcon, Shield, MoreHorizontal, Briefcase, Laptop,
  Gift, CircleDollarSign, Tag, LayoutDashboard, WalletIcon,
  Loader2, CirclePlus
} from "lucide-react"

import { walletApi, categoryApi, transactionApi, dashboardApi } from "@/lib/api"
import type { WalletResponse, CategoryResponse, TransactionResponse, DashboardSummary } from "@/lib/validations"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

// --- Icon mapping ---
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UtensilsCrossed, Car, ShoppingBag, Gamepad2, Receipt, Heart,
  GraduationCap, Home: HomeIcon, Shield, MoreHorizontal, Briefcase, Laptop,
  Gift, TrendingUp, DollarSign, CircleDollarSign, Tag,
}

function getIcon(iconName: string | null) {
  if (!iconName) return Tag
  return iconMap[iconName] || Tag
}

// --- Currency formatter (Indonesian Rupiah) ---
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// --- Type for wallet with transaction count ---
type WalletWithCount = WalletResponse & { transactionCount: number }
type CategoryWithCount = CategoryResponse & { transactionCount: number }

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function Home() {
  const { toast } = useToast()

  // --- Data state ---
  const [wallets, setWallets] = useState<WalletWithCount[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryWithCount[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryWithCount[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionResponse[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)

  // --- Loading state ---
  const [loading, setLoading] = useState(true)

  // --- Dialog states ---
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [editWalletOpen, setEditWalletOpen] = useState(false)
  const [addIncomeCatOpen, setAddIncomeCatOpen] = useState(false)
  const [addExpenseCatOpen, setAddExpenseCatOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

  // --- Form states ---
  const [walletName, setWalletName] = useState("")
  const [walletBalance, setWalletBalance] = useState("")
  const [editingWallet, setEditingWallet] = useState<WalletWithCount | null>(null)
  const [editWalletName, setEditWalletName] = useState("")

  const [catName, setCatName] = useState("")
  const [catIcon, setCatIcon] = useState("")
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)
  const [editCatName, setEditCatName] = useState("")
  const [editCatIcon, setEditCatIcon] = useState("")

  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [txAmount, setTxAmount] = useState("")
  const [txWalletId, setTxWalletId] = useState("")
  const [txCategoryId, setTxCategoryId] = useState("")
  const [txDate, setTxDate] = useState<Date>(new Date())
  const [txDescription, setTxDescription] = useState("")

  const [submitting, setSubmitting] = useState(false)

  // --- Fetch functions ---
  const fetchWallets = useCallback(async () => {
    try {
      const data = await walletApi.list()
      setWallets(data)
    } catch {
      // silent
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const [income, expense] = await Promise.all([
        categoryApi.list("INCOME"),
        categoryApi.list("EXPENSE"),
      ])
      setIncomeCategories(income)
      setExpenseCategories(expense)
    } catch {
      // silent
    }
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      const summary = await dashboardApi.summary()
      setDashboardSummary(summary)
    } catch {
      // silent
    }
  }, [])

  const fetchRecentTransactions = useCallback(async () => {
    try {
      const result = await dashboardApi.search({ page: "1", pageSize: "5" })
      setRecentTransactions(result.data)
    } catch {
      // silent
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchWallets(),
      fetchCategories(),
      fetchDashboard(),
      fetchRecentTransactions(),
    ])
    setLoading(false)
  }, [fetchWallets, fetchCategories, fetchDashboard, fetchRecentTransactions])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // --- Wallet handlers ---
  const handleCreateWallet = async () => {
    if (!walletName.trim()) return
    setSubmitting(true)
    try {
      await walletApi.create({ name: walletName.trim(), balance: walletBalance ? parseFloat(walletBalance) : 0 })
      toast({ title: "Wallet created", description: `"${walletName}" has been added.` })
      setWalletName("")
      setWalletBalance("")
      setAddWalletOpen(false)
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create wallet", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateWallet = async () => {
    if (!editingWallet || !editWalletName.trim()) return
    setSubmitting(true)
    try {
      await walletApi.update(editingWallet.id, { name: editWalletName.trim() })
      toast({ title: "Wallet updated", description: `Wallet renamed to "${editWalletName}".` })
      setEditWalletOpen(false)
      setEditingWallet(null)
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update wallet", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteWallet = async (id: string, name: string) => {
    try {
      await walletApi.delete(id)
      toast({ title: "Wallet deleted", description: `"${name}" has been removed.` })
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete wallet", variant: "destructive" })
    }
  }

  // --- Category handlers ---
  const handleCreateCategory = async (type: "INCOME" | "EXPENSE") => {
    if (!catName.trim()) return
    setSubmitting(true)
    try {
      await categoryApi.create({ name: catName.trim(), type, icon: catIcon.trim() || undefined })
      toast({ title: "Category created", description: `"${catName}" has been added.` })
      setCatName("")
      setCatIcon("")
      if (type === "INCOME") setAddIncomeCatOpen(false)
      else setAddExpenseCatOpen(false)
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create category", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    setSubmitting(true)
    try {
      await categoryApi.update(editingCategory.id, {
        name: editCatName.trim() || undefined,
        icon: editCatIcon.trim() || undefined,
      })
      toast({ title: "Category updated", description: `"${editCatName}" has been updated.` })
      setEditCategoryOpen(false)
      setEditingCategory(null)
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update category", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await categoryApi.delete(id)
      toast({ title: "Category deleted", description: `"${name}" has been removed.` })
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete category", variant: "destructive" })
    }
  }

  // --- Transaction handler ---
  const handleCreateTransaction = async () => {
    if (!txAmount || !txWalletId || !txCategoryId || !txDate) return
    setSubmitting(true)
    try {
      await transactionApi.create({
        amount: parseFloat(txAmount),
        type: txType,
        description: txDescription.trim() || undefined,
        transactionDate: format(txDate, "yyyy-MM-dd"),
        walletId: txWalletId,
        categoryId: txCategoryId,
      })
      toast({
        title: "Transaction added",
        description: `${txType === "INCOME" ? "Income" : "Expense"} of ${formatCurrency(parseFloat(txAmount))} recorded.`,
      })
      setTxType("EXPENSE")
      setTxAmount("")
      setTxWalletId("")
      setTxCategoryId("")
      setTxDate(new Date())
      setTxDescription("")
      setAddTransactionOpen(false)
      await refreshAll()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create transaction", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Available icon names for category creation ---
  const availableIcons = [
    "UtensilsCrossed", "Car", "ShoppingBag", "Gamepad2", "Receipt",
    "Heart", "GraduationCap", "Home", "Shield", "MoreHorizontal",
    "Briefcase", "Laptop", "Gift", "TrendingUp", "DollarSign",
    "CircleDollarSign", "Tag",
  ]

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Finance Tracker</h1>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4 hidden sm:block" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="wallets" className="gap-1.5">
              <WalletIcon className="h-4 w-4 hidden sm:block" />
              Wallets
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <Tag className="h-4 w-4 hidden sm:block" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* ========== DASHBOARD TAB ========== */}
          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Total Balance */}
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Total Balance
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                        {formatCurrency(dashboardSummary?.netBalance ?? 0)}
                      </div>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                        Across {dashboardSummary?.walletCount ?? 0} wallet{dashboardSummary?.walletCount !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Total Income */}
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        Total Income
                      </CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                        {formatCurrency(dashboardSummary?.totalIncome ?? 0)}
                      </div>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                        All time income
                      </p>
                    </CardContent>
                  </Card>

                  {/* Total Expense */}
                  <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">
                        Total Expense
                      </CardTitle>
                      <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-rose-900 dark:text-rose-200">
                        {formatCurrency(dashboardSummary?.totalExpense ?? 0)}
                      </div>
                      <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">
                        All time expenses
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Add Transaction + Recent Transactions */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Transactions</h2>
                  <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                        <CirclePlus className="h-4 w-4" />
                        Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                        <DialogDescription>Record a new income or expense transaction.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* Type Toggle */}
                        <div className="grid gap-2">
                          <Label>Type</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={txType === "INCOME" ? "default" : "outline"}
                              className={txType === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700 flex-1" : "flex-1"}
                              onClick={() => { setTxType("INCOME"); setTxCategoryId("") }}
                            >
                              <TrendingUp className="h-4 w-4 mr-1.5" />
                              Income
                            </Button>
                            <Button
                              type="button"
                              variant={txType === "EXPENSE" ? "default" : "outline"}
                              className={txType === "EXPENSE" ? "bg-rose-600 hover:bg-rose-700 flex-1" : "flex-1"}
                              onClick={() => { setTxType("EXPENSE"); setTxCategoryId("") }}
                            >
                              <TrendingDown className="h-4 w-4 mr-1.5" />
                              Expense
                            </Button>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="grid gap-2">
                          <Label htmlFor="tx-amount">Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="tx-amount"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-9"
                              value={txAmount}
                              onChange={(e) => setTxAmount(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Wallet Selector */}
                        <div className="grid gap-2">
                          <Label>Wallet</Label>
                          <Select value={txWalletId} onValueChange={setTxWalletId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a wallet" />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No wallets available</div>
                              ) : (
                                wallets.map((w) => (
                                  <SelectItem key={w.id} value={w.id}>
                                    {w.name} ({formatCurrency(w.balance)})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Category Selector */}
                        <div className="grid gap-2">
                          <Label>Category</Label>
                          <Select value={txCategoryId} onValueChange={setTxCategoryId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {(txType === "INCOME" ? incomeCategories : expenseCategories).length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  No {txType.toLowerCase()} categories available
                                </div>
                              ) : (
                                (txType === "INCOME" ? incomeCategories : expenseCategories).map((c) => {
                                  const IconComp = getIcon(c.icon)
                                  return (
                                    <SelectItem key={c.id} value={c.id}>
                                      <span className="flex items-center gap-2">
                                        <IconComp className="h-3.5 w-3.5" />
                                        {c.name}
                                      </span>
                                    </SelectItem>
                                  )
                                })
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Picker */}
                        <div className="grid gap-2">
                          <Label>Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                              >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {txDate ? format(txDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={txDate}
                                onSelect={(d) => d && setTxDate(d)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                          <Label htmlFor="tx-desc">Description (optional)</Label>
                          <Input
                            id="tx-desc"
                            placeholder="What was this transaction for?"
                            value={txDescription}
                            onChange={(e) => setTxDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddTransactionOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateTransaction}
                          disabled={submitting || !txAmount || !txWalletId || !txCategoryId}
                          className={txType === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
                        >
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add {txType === "INCOME" ? "Income" : "Expense"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator />

                {/* Recent Transactions List */}
                {recentTransactions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                        <Receipt className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium">No transactions yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start by adding your first transaction to track your finances.
                      </p>
                      <Button
                        className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setAddTransactionOpen(true)}
                      >
                        <CirclePlus className="h-4 w-4" />
                        Add Transaction
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => {
                      const isIncome = tx.type === "INCOME"
                      const IconComp = getIcon(tx.categoryIcon)
                      return (
                        <Card key={tx.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              isIncome
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                            }`}>
                              <IconComp className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{tx.categoryName}</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                                  isIncome
                                    ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                                    : "border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400"
                                }`}>
                                  {isIncome ? "Income" : "Expense"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {tx.description || tx.walletName} &middot; {tx.transactionDate}
                              </p>
                            </div>
                            <div className={`text-sm font-semibold shrink-0 ${
                              isIncome ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                            }`}>
                              {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* Dashboard empty state - no wallets */}
                {wallets.length === 0 && (
                  <Card className="border-dashed mt-6">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium">No wallets yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create your first wallet to start tracking your finances.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ========== WALLETS TAB ========== */}
          <TabsContent value="wallets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Wallets</h2>
              <Dialog open={addWalletOpen} onOpenChange={setAddWalletOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" />
                    Add Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Create Wallet</DialogTitle>
                    <DialogDescription>Add a new wallet to track your finances.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="wallet-name">Wallet Name</Label>
                      <Input
                        id="wallet-name"
                        placeholder="e.g. Main Account"
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="wallet-balance">Initial Balance</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="wallet-balance"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-9"
                          value={walletBalance}
                          onChange={(e) => setWalletBalance(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddWalletOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handleCreateWallet}
                      disabled={submitting || !walletName.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Wallet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : wallets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 mb-4">
                    <Wallet className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-base font-semibold">No wallets yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Add your first wallet to start tracking your balance, income, and expenses.
                  </p>
                  <Button
                    className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setAddWalletOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add your first wallet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                  <Card key={wallet.id} className="hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                            <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{wallet.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {wallet.transactionCount} transaction{wallet.transactionCount !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingWallet(wallet)
                              setEditWalletName(wallet.name)
                              setEditWalletOpen(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                            onClick={() => handleDeleteWallet(wallet.id, wallet.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                        {formatCurrency(wallet.balance)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Wallet Dialog */}
            <Dialog open={editWalletOpen} onOpenChange={setEditWalletOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Edit Wallet</DialogTitle>
                  <DialogDescription>Change the name of your wallet.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-wallet-name">Wallet Name</Label>
                    <Input
                      id="edit-wallet-name"
                      value={editWalletName}
                      onChange={(e) => setEditWalletName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditWalletOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleUpdateWallet}
                    disabled={submitting || !editWalletName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ========== CATEGORIES TAB ========== */}
          <TabsContent value="categories" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Income Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-base font-semibold">Income Categories</h3>
                    </div>
                    <Dialog open={addIncomeCatOpen} onOpenChange={setAddIncomeCatOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Add Income Category</DialogTitle>
                          <DialogDescription>Create a new income category.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="inc-cat-name">Name</Label>
                            <Input
                              id="inc-cat-name"
                              placeholder="e.g. Dividends"
                              value={catName}
                              onChange={(e) => setCatName(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Icon</Label>
                            <Select value={catIcon} onValueChange={setCatIcon}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose an icon" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIcons.map((icon) => {
                                  const IconComp = getIcon(icon)
                                  return (
                                    <SelectItem key={icon} value={icon}>
                                      <span className="flex items-center gap-2">
                                        <IconComp className="h-3.5 w-3.5" />
                                        {icon}
                                      </span>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddIncomeCatOpen(false)}>Cancel</Button>
                          <Button
                            onClick={() => handleCreateCategory("INCOME")}
                            disabled={submitting || !catName.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Category
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {incomeCategories.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center py-8 text-center">
                        <p className="text-sm text-muted-foreground">No income categories yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {incomeCategories.map((cat) => {
                        const IconComp = getIcon(cat.icon)
                        return (
                          <Card key={cat.id} className="hover:shadow-sm transition-shadow group">
                            <CardContent className="flex items-center gap-3 p-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                                <IconComp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm">{cat.name}</span>
                                <p className="text-xs text-muted-foreground">
                                  {cat.transactionCount} transaction{cat.transactionCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingCategory(cat)
                                    setEditCatName(cat.name)
                                    setEditCatIcon(cat.icon || "")
                                    setEditCategoryOpen(true)
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Expense Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                        <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <h3 className="text-base font-semibold">Expense Categories</h3>
                    </div>
                    <Dialog open={addExpenseCatOpen} onOpenChange={setAddExpenseCatOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Add Expense Category</DialogTitle>
                          <DialogDescription>Create a new expense category.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="exp-cat-name">Name</Label>
                            <Input
                              id="exp-cat-name"
                              placeholder="e.g. Subscriptions"
                              value={catName}
                              onChange={(e) => setCatName(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Icon</Label>
                            <Select value={catIcon} onValueChange={setCatIcon}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose an icon" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIcons.map((icon) => {
                                  const IconComp = getIcon(icon)
                                  return (
                                    <SelectItem key={icon} value={icon}>
                                      <span className="flex items-center gap-2">
                                        <IconComp className="h-3.5 w-3.5" />
                                        {icon}
                                      </span>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddExpenseCatOpen(false)}>Cancel</Button>
                          <Button
                            onClick={() => handleCreateCategory("EXPENSE")}
                            disabled={submitting || !catName.trim()}
                            className="bg-rose-600 hover:bg-rose-700"
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Category
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {expenseCategories.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center py-8 text-center">
                        <p className="text-sm text-muted-foreground">No expense categories yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {expenseCategories.map((cat) => {
                        const IconComp = getIcon(cat.icon)
                        return (
                          <Card key={cat.id} className="hover:shadow-sm transition-shadow group">
                            <CardContent className="flex items-center gap-3 p-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                                <IconComp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm">{cat.name}</span>
                                <p className="text-xs text-muted-foreground">
                                  {cat.transactionCount} transaction{cat.transactionCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingCategory(cat)
                                    setEditCatName(cat.name)
                                    setEditCatIcon(cat.icon || "")
                                    setEditCategoryOpen(true)
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit Category Dialog */}
            <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                  <DialogDescription>Update the name and icon of this category.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cat-name">Name</Label>
                    <Input
                      id="edit-cat-name"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Icon</Label>
                    <Select value={editCatIcon} onValueChange={setEditCatIcon}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map((icon) => {
                          const IconComp = getIcon(icon)
                          return (
                            <SelectItem key={icon} value={icon}>
                              <span className="flex items-center gap-2">
                                <IconComp className="h-3.5 w-3.5" />
                                {icon}
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditCategoryOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleUpdateCategory}
                    disabled={submitting || !editCatName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto flex h-12 items-center justify-center px-4 sm:px-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Finance Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
