import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface WodifyUser {
  CustomerId: string
  UserId: string
}

export interface JWTPayload extends WodifyUser {
  iat: number
  exp: number
}

export async function validateWodifyToken(token: string): Promise<WodifyUser | null> {
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

export function createJWT(user: WodifyUser): string {
  return jwt.sign(
    {
      CustomerId: user.CustomerId,
      UserId: user.UserId,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  )
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}
