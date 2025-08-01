import type { NextRequest } from "next/server"
import { verifyJWT, type JWTPayload } from "@/lib/auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth<T extends any[]>(handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authHeader = request.headers.get("authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      const user = verifyJWT(token)

      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest, ...args)
    } catch (error) {
      console.error("❌ Auth middleware error:", error)
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
