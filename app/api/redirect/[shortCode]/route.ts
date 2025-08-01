import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, increment, arrayUnion } from "firebase/firestore"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    // Get URL data
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return NextResponse.redirect(new URL("/not-found", request.url))
    }

    const urlData = urlDoc.data()

    if (!urlData.isActive) {
      return NextResponse.redirect(new URL("/not-found", request.url))
    }

    // Track click with embedded analytics
    const clickEvent = {
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
      ip: request.ip || request.headers.get("x-forwarded-for") || "",
    }

    // Update embedded analytics
    await updateDoc(doc(db, "urls", shortCode), {
      totalClicks: increment(1),
      lastClickAt: clickEvent.timestamp,
      clickEvents: arrayUnion(clickEvent),
    })

    // Redirect to original URL
    return NextResponse.redirect(urlData.originalUrl)
  } catch (error) {
    console.error("Error redirecting:", error)
    return NextResponse.redirect(new URL("/not-found", request.url))
  }
}
