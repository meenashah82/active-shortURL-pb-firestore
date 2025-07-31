import type { NextRequest } from "next/server"
import { verifyJWT, type WodifyUser } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user: WodifyUser
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = verifyJWT(token)

    if (!decoded) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = decoded.user

    return handler(authenticatedRequest)
  }
}
