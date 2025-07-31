import type { NextRequest } from "next/server"
import { verifyJWT } from "@/lib/auth"

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

export function withAuth<T extends any[]>(handler: (req: AuthenticatedRequest, ...args: T) => Promise<Response>) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = requireAuth(req)
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user
      return await handler(authenticatedReq, ...args)
    } catch (error) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
