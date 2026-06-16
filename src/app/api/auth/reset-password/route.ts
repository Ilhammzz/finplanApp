// app/api/auth/reset-password/route.ts
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { handleError, successResponse, ValidationError } from "@/lib/api-utils"
import { z } from "zod"
import bcrypt from "bcryptjs"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find user by token
    const user = await db.user.findFirst({
      where: { resetToken: token },
    })

    if (!user) {
      throw new ValidationError("Invalid or expired reset token")
    }

    // Check token expiry
    if (new Date(user.resetTokenExp!) < new Date()) {
      throw new ValidationError("Reset token has expired")
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    })

    return successResponse({
      message: "Password has been reset successfully.",
    })
  } catch (error) {
    return handleError(error)
  }
}