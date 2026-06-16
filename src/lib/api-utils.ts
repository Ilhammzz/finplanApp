// ============================================
// API Error Handling Utility
// Equivalent to @ControllerAdvice in Spring Boot
// ============================================

import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      "NOT_FOUND"
    )
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(walletName: string, balance: number, amount: number) {
    super(
      `Insufficient balance in '${walletName}'. Current: ${balance}, Required: ${amount}`,
      400,
      "INSUFFICIENT_BALANCE"
    )
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR")
  }
}

// Global error handler - converts errors to consistent API responses
export function handleError(error: unknown): NextResponse {
  console.error("[API Error]", error)

  // AppError (our custom errors)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "APP_ERROR",
          message: error.message,
        },
      },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "A record with this data already exists",
            },
          },
          { status: 409 }
        )
      case "P2025":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Record not found",
            },
          },
          { status: 404 }
        )
      case "P2003":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FOREIGN_KEY_ERROR",
              message: "Referenced record does not exist",
            },
          },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Database operation failed",
            },
          },
          { status: 500 }
        )
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message,
        },
      },
      { status: 500 }
    )
  }

  // Unknown errors
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  )
}

// Success response helper
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}
