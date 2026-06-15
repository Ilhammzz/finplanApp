// ============================================
// Auth Helper - Get current session user in API routes
// ============================================

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return session.user as AuthUser
}

export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be signed in" } },
      { status: 401 }
    )
  }
  return user
}
