import jwt from "jsonwebtoken"

export interface WodifyTokenValidationResponse {
  CustomerId: string
  UserId: string
  success?: boolean
  error?: string
}

export interface AuthUser {
  customerId: string
  userId: string
  token: string
}

export interface JWTPayload {
  customerId: string
  userId: string
  iat: number
  exp: number
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function validateWodifyToken(token: string): Promise<WodifyTokenValidationResponse> {
  try {
    console.log("🔐 Validating Wodify token...")

    const response = await fetch("https://dev.wodify.com/Token_OS/rest/TESTPOC/ValidateTokenLoginAs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })

    console.log("📋 Wodify API response status:", response.status)

    if (!response.ok) {
      console.error("❌ Wodify API error:", response.status, response.statusText)
      return {
        CustomerId: "",
        UserId: "",
        success: false,
        error: `Wodify API error: ${response.status}`,
      }
    }

    const data = await response.json()
    console.log("📋 Wodify API response data:", data)

    if (data.CustomerId && data.UserId) {
      console.log("✅ Wodify token validated successfully")
      return {
        CustomerId: data.CustomerId,
        UserId: data.UserId,
        success: true,
      }
    } else {
      console.error("❌ Invalid Wodify response structure:", data)
      return {
        CustomerId: "",
        UserId: "",
        success: false,
        error: "Invalid response from Wodify API",
      }
    }
  } catch (error) {
    console.error("❌ Error validating Wodify token:", error)
    return {
      CustomerId: "",
      UserId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export function createJWT(customerId: string, userId: string): string {
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    customerId,
    userId,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error("❌ JWT verification failed:", error)
    return null
  }
}

export function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}
