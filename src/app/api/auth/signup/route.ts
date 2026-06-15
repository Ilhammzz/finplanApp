// ============================================
// Sign Up API Route - POST (register new user)
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { handleError, successResponse, ValidationError } from "@/lib/api-utils"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = signupSchema.parse(body)

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      throw new ValidationError("An account with this email already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
      },
    })

    // Auto-seed default categories for the new user
    const expenseCategories = [
      { name: "Food & Dining", type: "EXPENSE", icon: "UtensilsCrossed" },
      { name: "Transportation", type: "EXPENSE", icon: "Car" },
      { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag" },
      { name: "Entertainment", type: "EXPENSE", icon: "Gamepad2" },
      { name: "Bills & Utilities", type: "EXPENSE", icon: "Receipt" },
      { name: "Health & Medical", type: "EXPENSE", icon: "Heart" },
      { name: "Education", type: "EXPENSE", icon: "GraduationCap" },
      { name: "Housing & Rent", type: "EXPENSE", icon: "Home" },
      { name: "Insurance", type: "EXPENSE", icon: "Shield" },
      { name: "Other Expense", type: "EXPENSE", icon: "MoreHorizontal" },
    ]

    const incomeCategories = [
      { name: "Salary", type: "INCOME", icon: "Briefcase" },
      { name: "Freelance", type: "INCOME", icon: "Laptop" },
      { name: "Investment", type: "INCOME", icon: "TrendingUp" },
      { name: "Gift", type: "INCOME", icon: "Gift" },
      { name: "Other Income", type: "INCOME", icon: "MoreHorizontal" },
    ]

    await db.category.createMany({
      data: [...expenseCategories, ...incomeCategories].map((cat) => ({
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        userId: user.id,
      })),
    })

    return successResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      201
    )
  } catch (error) {
    return handleError(error)
  }
}
