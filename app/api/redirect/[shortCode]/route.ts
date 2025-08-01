import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { trackClickUnified } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    // Get URL document
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    const urlData = urlDoc.data()

    if (!urlData.isActive) {
      return NextResponse.json({ error: "URL is inactive" }, { status: 410 })
    }

    // Track the click with unified analytics
    const userAgent = request.headers.get("user-agent") || undefined
    const referer = request.headers.get("referer") || undefined
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || undefined

    await trackClickUnified(shortCode, {
      userAgent,
      referer,
      ip,
    })

    // Return redirect response
    return NextResponse.redirect(urlData.originalUrl, 302)
  } catch (error) {
    console.error("Error processing redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
