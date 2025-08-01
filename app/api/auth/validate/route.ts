import { type NextRequest, NextResponse } from "next/server"
import { validateWodifyToken, createJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Auth validation API called")

    const body = await request.json()
    console.log("📋 Request body keys:", Object.keys(body))

    const { token } = body

    if (!token) {
      console.error("❌ No token provided in request")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("🔐 Validating Wodify token...")

    // Validate token with Wodify API
    const validation = await validateWodifyToken(token)
    console.log("📋 Wodify validation result:", validation)

    if (!validation.success || !validation.CustomerId || !validation.UserId) {
      console.error("❌ Wodify token validation failed:", validation.error)
      return NextResponse.json(
        {
          error: validation.error || "Invalid token",
          success: false,
        },
        { status: 401 },
      )
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
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 },
    )
  }
}
