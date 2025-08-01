import { type NextRequest, NextResponse } from "next/server"
import { validateWodifyToken, createJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("🔐 Validating Wodify token via API...")

    // Validate token with Wodify API
    const validation = await validateWodifyToken(token)

    if (!validation.success || !validation.CustomerId || !validation.UserId) {
      console.error("❌ Wodify token validation failed:", validation.error)
      return NextResponse.json({ error: validation.error || "Invalid token" }, { status: 401 })
    }

    // Create JWT for internal use
    const jwt = createJWT(validation.CustomerId, validation.UserId)

    console.log("✅ Authentication successful:", {
      customerId: validation.CustomerId,
      userId: validation.UserId,
    })

    return NextResponse.json({
      success: true,
      jwt,
      user: {
        customerId: validation.CustomerId,
        userId: validation.UserId,
      },
    })
  } catch (error) {
    console.error("❌ Auth validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
