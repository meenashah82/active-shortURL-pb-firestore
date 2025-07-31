import type { NextRequest } from "next/server"
import { verifyJWT, type AuthUser } from "./auth"

export function getAuthUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyJWT(token)
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = getAuthUser(request)

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}
