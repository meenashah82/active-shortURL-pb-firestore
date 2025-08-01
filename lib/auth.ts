import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  customerId: string
  userId: string
}

export function verifyJWT(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      customerId: decoded.customerId,
      userId: decoded.userId,
    }
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

export function createJWT(user: User): string {
  return jwt.sign(
    {
      customerId: user.customerId,
      userId: user.userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    },
    JWT_SECRET,
  )
}
