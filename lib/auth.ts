import jwt from "jsonwebtoken"

export interface JWTPayload {
  customerId: string
  userId: string
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

export async function validateWodifyToken(token: string): Promise<{ CustomerId: string; UserId: string } | null> {
  try {
    const response = await fetch("https://dev.wodify.com/Token_OS/rest/TESTPOC/ValidateTokenLoginAs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
