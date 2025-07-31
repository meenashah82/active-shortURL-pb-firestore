import jwt from "jsonwebtoken"

export interface WodifyTokenResponse {
  CustomerId: string
  UserId: string
}

export interface AuthUser {
  customerId: string
  userId: string
}

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key"

export async function validateWodifyToken(token: string): Promise<WodifyTokenResponse | null> {
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
        CustomerId: data.CustomerId,
        UserId: data.UserId,
      }
    }

    return null
  } catch (error) {
    console.error("Error validating Wodify token:", error)
    return null
  }
}

export function createJWT(user: AuthUser): string {
  return jwt.sign(
    {
      customerId: user.customerId,
      userId: user.userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    JWT_SECRET,
  )
}

export function verifyJWT(token: string): AuthUser | null {
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
