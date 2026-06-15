// ============================================
// Forgot Password API Route - POST (generate reset token)
// In production, this would send an email with the reset link.
// Here we return the token directly for the demo.
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { handleError, successResponse, NotFoundError } from "@/lib/api-utils"
import { z } from "zod"
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
        message: "If an account with this email exists, a reset token has been generated.",
      })
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExp = new Date(Date.now() + 3600000).toISOString() // 1 hour from now

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
      },
    })

    // In production: send email with reset link containing the token
    // For demo: return the token in the response
    return successResponse({
      message: "Reset token generated successfully.",
      token: resetToken, // In production, this would be sent via email
    })
  } catch (error) {
    return handleError(error)
  }
}
