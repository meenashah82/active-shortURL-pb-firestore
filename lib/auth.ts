import jwt from "jsonwebtoken"

export interface JWTPayload {
  userId: string
  email: string
  wodifyToken: string
  iat?: number
  exp?: number
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET not configured")
      return null
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    return decoded
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

export function createJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured")
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: "24h" })
}
