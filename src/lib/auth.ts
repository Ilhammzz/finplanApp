// ============================================
// NextAuth.js Configuration
// Credentials provider with email/password
// ============================================

import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] authorize called with:", credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials")
          return null
        }

        try {
          console.log("[Auth] Looking up user...")
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          })

          console.log("[Auth] User found:", user ? `YES (${user.id})` : "NO")

          if (!user) {
            return null
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          console.log("[Auth] Password valid:", isValidPassword)

          if (!isValidPassword) {
            return null
          }

          console.log("[Auth] Returning user object")
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        } catch (error) {
          console.error("[Auth] Authorization error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as typeof session.user & { id: string }).id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/", // We handle sign-in on the main page
  },
  secret: process.env.NEXTAUTH_SECRET,
}
