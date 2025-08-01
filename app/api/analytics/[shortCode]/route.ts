import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

async function handler(request: AuthenticatedRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    // Find URL by shortCode
    const urlsRef = collection(db, "urls")
    const q = query(urlsRef, where("shortCode", "==", shortCode), where("isActive", "==", true))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    const urlDoc = querySnapshot.docs[0]
    const urlData = urlDoc.data()

    // Check if user owns this URL
    if (urlData.customerId !== request.user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      shortCode: urlData.shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks || 0,
      lastClickAt: urlData.lastClickAt,
      clickEvents: urlData.clickEvents || [],
      createdAt: urlData.createdAt,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(handler)
