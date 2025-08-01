import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"

async function analyticsHandler(request: AuthenticatedRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    // Get URL data with embedded analytics
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    const urlData = urlDoc.data()

    // Check if user owns this URL
    if (urlData.customerId !== request.user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks || 0,
      lastClickAt: urlData.lastClickAt,
      clickEvents: urlData.clickEvents || [],
      createdAt: urlData.createdAt,
      isActive: urlData.isActive,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(analyticsHandler)
