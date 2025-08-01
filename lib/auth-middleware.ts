import type { NextRequest } from "next/server"
import { verifyJWT } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    customerId: string
    userId: string
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get("authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ No valid authorization header")
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      const token = authHeader.substring(7)
      const user = verifyJWT(token)

      if (!user) {
        console.error("❌ Invalid JWT token")
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      console.log("✅ User authenticated:", user)

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest)
    } catch (error) {
      console.error("❌ Auth middleware error:", error)
      return new Response(JSON.stringify({ error: "Authentication error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
