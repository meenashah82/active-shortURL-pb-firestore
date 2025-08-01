import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface UserData {
  customerId: string
  userId: string
}

export async function validateWodifyToken(token: string): Promise<UserData | null> {
  try {
    const response = await fetch("https://api.wodify.com/v2/token/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.customerId && data.userId) {
      return {
        customerId: data.customerId,
        userId: data.userId,
      }
    }

    return null
  } catch (error) {
    console.error("Error validating Wodify token:", error)
    return null
  }
}

export function createJWT(userData: UserData): string {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyJWT(token: string): UserData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserData
    return decoded
  } catch (error) {
    console.error("Error verifying JWT:", error)
    return null
  }
}
