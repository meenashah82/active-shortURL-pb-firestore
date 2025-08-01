import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT, type User } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user: User
}

export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get("authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      const token = authHeader.substring(7)
      const user = verifyJWT(token)

      if (!user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}
