import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

async function analyticsHandler(request: NextRequest, user: any, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    // Get URL document with embedded analytics
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return NextResponse.json({ error: "Short URL not found" }, { status: 404 })
    }

    const urlData = urlDoc.data()

    // Return analytics data
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
