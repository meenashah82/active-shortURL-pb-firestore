import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    console.log("📋 Auth validation API called")
    console.log("📋 Token received:", token ? "Yes" : "No")

    if (!token) {
      console.error("❌ No token provided")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Validate token with Wodify API
    console.log("🔍 Calling Wodify API for token validation...")

    const wodifyResponse = await fetch("https://dev.wodify.com/Token_OS/rest/TESTPOC/ValidateTokenLoginAs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })

    console.log("📡 Wodify API response status:", wodifyResponse.status)

    if (!wodifyResponse.ok) {
      const errorText = await wodifyResponse.text()
      console.error("❌ Wodify validation failed:", wodifyResponse.status, errorText)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userData = await wodifyResponse.json()
    console.log("✅ Wodify validation successful:", userData)

    // Create JWT for our app
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const appJWT = jwt.sign(
      {
        customerId: userData.CustomerId,
        userId: userData.UserId,
        wodifyToken: token,
      },
      jwtSecret,
      { expiresIn: "24h" },
    )

    console.log("🎫 Created app JWT successfully")

    return NextResponse.json({
      success: true,
      jwt: appJWT,
      user: {
        customerId: userData.CustomerId,
        userId: userData.UserId,
      },
    })
  } catch (error) {
    console.error("❌ Token validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
