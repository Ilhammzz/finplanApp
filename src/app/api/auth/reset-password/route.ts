// ============================================
// Reset Password API Route - POST (reset password with token)
// ============================================

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { handleError, successResponse, ValidationError } from "@/lib/api-utils"
import bcrypt from "bcryptjs"
import { z } from "zod"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = resetPasswordSchema.parse(body)

    // Find user by reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: validated.token,
      },
    })

    if (!user) {
      throw new ValidationError("Invalid or expired reset token")
    }

    // Check token expiry
    if (!user.resetTokenExp || new Date(user.resetTokenExp) < new Date()) {
      throw new ValidationError("Reset token has expired. Please request a new one.")
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Update password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    })

    return successResponse({
      message: "Password has been reset successfully. You can now sign in with your new password.",
    })
  } catch (error) {
    return handleError(error)
  }
}
