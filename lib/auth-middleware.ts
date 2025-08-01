import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user: {
    customerId: string
    userId: string
  }
}

export function requireAuth(request: NextRequest): { customerId: string; userId: string } {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authentication required")
  }

  const token = authHeader.substring(7)
  const payload = verifyJWT(token)

  if (!payload) {
    throw new Error("Authentication required")
  }

  return {
    customerId: payload.CustomerId,
    userId: payload.UserId,
  }
}

export function withAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    try {
      const authHeader = request.headers.get("authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
      }

      const token = authHeader.substring(7)
      const payload = verifyJWT(token)

      if (!payload) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }
      // Add user info to request context
      ;(request as any).user = payload

      return handler(request, context)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}
