// app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { handleError, successResponse } from "@/lib/api-utils"
import { z } from "zod"
import { sendResetEmail } from "@/lib/email"
import crypto from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = forgotPasswordSchema.parse(body)

    const user = await db.user.findUnique({
      where: { email: validated.email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse({
        message: "If an account with this email exists, a reset link has been sent.",
      })
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExp = new Date(Date.now() + 3600000).toISOString()

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    })

    // Send email (don't return token)
    await sendResetEmail({ to: user.email, resetToken })

    return successResponse({
      message: "If an account with this email exists, a reset link has been sent.",
    })
  } catch (error) {
    return handleError(error)
  }
}