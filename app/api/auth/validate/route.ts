import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    console.log("📋 Validating token:", token ? "Token received" : "No token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Validate token with Wodify API
    console.log("🔍 Calling Wodify API for token validation...")
    const wodifyResponse = await fetch("https://dev.wodify.com/api/v1/auth/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("📡 Wodify API response status:", wodifyResponse.status)

    if (!wodifyResponse.ok) {
      const errorText = await wodifyResponse.text()
      console.error("❌ Wodify validation failed:", errorText)
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
        userId: userData.id || userData.user_id,
        email: userData.email,
        wodifyToken: token,
      },
      jwtSecret,
      { expiresIn: "24h" },
    )

    console.log("🎫 Created app JWT successfully")

    return NextResponse.json({
      success: true,
      jwt: appJWT,
      user: userData,
    })
  } catch (error) {
    console.error("❌ Token validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
