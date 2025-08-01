import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    // Get URL document
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

    // Update analytics in the same document
    await updateDoc(doc(db, "urls", shortCode), {
      totalClicks: increment(1),
      lastClickAt: new Date(),
      clickEvents: arrayUnion(clickEvent),
    })

    console.log("✅ Click tracked for:", shortCode)

    // Redirect to original URL
    return NextResponse.redirect(urlData.originalUrl)
  } catch (error) {
    console.error("Error in redirect:", error)
    return NextResponse.redirect(new URL("/not-found", request.url))
  }
}
