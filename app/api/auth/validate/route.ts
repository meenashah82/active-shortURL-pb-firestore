import { type NextRequest, NextResponse } from "next/server"
import { createJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📋 Request body keys:", Object.keys(body))

    const { token } = body

    if (!token) {
      console.error("❌ No token provided in request")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("🔐 Validating Wodify token...")

    // Validate token with Wodify API
    const wodifyResponse = await fetch("https://api.wodify.com/v2/token/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("📋 Wodify API response status:", wodifyResponse.status)

    if (!wodifyResponse.ok) {
      console.error("❌ Wodify token validation failed:", wodifyResponse.status)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const wodifyData = await wodifyResponse.json()
    console.log("📋 Wodify API response data:", wodifyData)

    if (!wodifyData.customerId || !wodifyData.userId) {
      console.error("❌ Missing required fields in Wodify response:", wodifyData)
      return NextResponse.json({ error: "Invalid token data" }, { status: 401 })
    }

    // Create JWT for our app
    const jwt = createJWT({
      customerId: wodifyData.customerId,
      userId: wodifyData.userId,
    })

    console.log("✅ JWT created successfully")

    return NextResponse.json({
      success: true,
      jwt,
      user: {
        customerId: wodifyData.customerId,
        userId: wodifyData.userId,
      },
    })
  } catch (error) {
    console.error("❌ Error in auth validation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
