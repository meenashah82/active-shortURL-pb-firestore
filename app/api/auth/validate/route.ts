import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("📋 Validating token with Wodify API...")

    // Validate token with Wodify API
    const wodifyResponse = await fetch("https://dev.wodify.com/Token_OS/rest/TESTPOC/ValidateTokenLoginAs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    console.log("📋 Wodify API response status:", wodifyResponse.status)

    if (!wodifyResponse.ok) {
      console.error("❌ Wodify token validation failed")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const wodifyData = await wodifyResponse.json()
    console.log("📋 Wodify API response data:", wodifyData)

    if (!wodifyData.CustomerId || !wodifyData.UserId) {
      console.error("❌ Missing required fields in Wodify response")
      return NextResponse.json({ error: "Invalid token response" }, { status: 401 })
    }

    // Create JWT for our app
    const jwtPayload = {
      customerId: wodifyData.CustomerId,
      userId: wodifyData.UserId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    }

    const jwtToken = jwt.sign(jwtPayload, JWT_SECRET)

    console.log("✅ Token validation successful, JWT created")

    return NextResponse.json({
      success: true,
      customerId: wodifyData.CustomerId,
      userId: wodifyData.UserId,
      jwt: jwtToken,
    })
  } catch (error) {
    console.error("❌ Error validating token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
