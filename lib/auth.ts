import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface WodifyUser {
  customerId: string
  userId: string
}

export interface AuthToken {
  user: WodifyUser
  exp: number
  iat: number
}

export async function validateWodifyToken(token: string): Promise<WodifyUser | null> {
  try {
    const response = await fetch("https://dev.wodify.com/Token_OS/rest/TESTPOC/ValidateTokenLoginAs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      console.error("Wodify token validation failed:", response.status)
      return null
    }

    const data = await response.json()

    if (data.CustomerId && data.UserId) {
      return {
        customerId: data.CustomerId,
        userId: data.UserId,
      }
    }

    return null
  } catch (error) {
    console.error("Error validating Wodify token:", error)
    return null
  }
}

export function createJWT(user: WodifyUser): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyJWT(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}
