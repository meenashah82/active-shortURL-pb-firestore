import { type NextRequest, NextResponse } from "next/server"
import { validateWodifyToken, createJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Validate token with Wodify
    const user = await validateWodifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Create JWT for our app
    const jwt = createJWT(user)

    return NextResponse.json({
      success: true,
      jwt,
      user: {
        customerId: user.CustomerId,
        userId: user.UserId,
      },
    })
  } catch (error) {
    console.error("Auth validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
