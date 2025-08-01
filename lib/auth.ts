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

export async function validateWodifyToken(token: string): Promise<WodifyUser & { success?: boolean; error?: string }> {
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
      return {
        CustomerId: "",
        UserId: "",
        success: false,
        error: `Wodify API error: ${response.status}`,
      }
    }

    const data = await response.json()

    if (data.CustomerId && data.UserId) {
      return {
        CustomerId: data.CustomerId,
        UserId: data.UserId,
        success: true,
      }
    }

    return {
      CustomerId: "",
      UserId: "",
      success: false,
      error: "Invalid response from Wodify",
    }
  } catch (error) {
    console.error("Error validating Wodify token:", error)
    return {
      CustomerId: "",
      UserId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export function createJWT(customerId: string, userId: string): string {
  return jwt.sign(
    {
      CustomerId: customerId,
      UserId: userId,
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
