import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore'

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  console.log(`🚀 REDIRECT API: Starting GET request for shortCode: ${params.shortCode}`)

  try {
    const { shortCode } = params
    console.log(`🔍 REDIRECT API: Processing redirect request for shortCode: ${shortCode}`)

    if (!shortCode) {
      return NextResponse.json(
        { error: 'Short code is required' },
        { status: 400 }
      )
    }

    // Get the URL document
    const docRef = doc(db, 'urls', shortCode)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      )
    }

    const urlData = docSnap.data()
    const originalUrl = urlData.originalUrl

    console.log(`🔍 REDIRECT API: Calling getUrlData for shortCode: ${shortCode}`)
    // Get URL data using the clean analytics system
    // const urlData = await getUrlData(shortCode)

    // if (!urlData) {
    //   console.log(`❌ REDIRECT API: URL not found for shortCode: ${shortCode}`)
    //   return NextResponse.json({ error: "URL not found" }, { status: 404 })
    // }

    console.log(`✅ REDIRECT API: Found URL: ${originalUrl} for shortCode: ${shortCode}`)

    // Extract all headers for detailed click tracking
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    console.log(`📊 REDIRECT API: Extracted ${Object.keys(headers).length} headers`)

    // Record the click with detailed header information
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    console.log(`🔄 REDIRECT API: About to record click for shortCode: ${shortCode}`)
    console.log(`📊 REDIRECT API: Available headers: ${Object.keys(headers).join(", ")}`)
    console.log(`👤 REDIRECT API: User-Agent: ${userAgent}`)
    console.log(`🔗 REDIRECT API: Referer: ${referer}`)
    console.log(`🌐 REDIRECT API: IP: ${ip}`)

    try {
      // Record click - this MUST happen before returning the redirect URL
      console.log(`🔄 REDIRECT API: BEFORE calling recordClick() for shortCode: ${shortCode}`)

      // Record the click with analytics data
      await updateDoc(docRef, {
        totalClicks: increment(1),
        lastClickedAt: serverTimestamp(),
      })

      // Add click record to subcollection for detailed analytics
      const clicksRef = collection(db, 'urls', shortCode, 'clicks')
      await addDoc(clicksRef, {
        timestamp: serverTimestamp(),
        userAgent,
        referer,
        ip: ip.split(',')[0].trim(), // Take first IP if multiple
        country: null, // Could be populated with IP geolocation service
        city: null,
      })

      console.log(`Recorded click for ${shortCode} -> ${originalUrl}`)
    } catch (analyticsError) {
      console.error('Error recording analytics:', analyticsError)
      // Continue with redirect even if analytics fails
    }

    // Ensure the URL has a protocol
    let redirectUrl = originalUrl
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = `https://${redirectUrl}`
    }

    console.log(`✅ REDIRECT API: Returning redirect URL for shortCode: ${shortCode}`)

    // Return redirect response
    return NextResponse.redirect(redirectUrl, { status: 302 })

  } catch (error) {
    console.error(`❌ REDIRECT API: Error in redirect API for shortCode: ${params.shortCode}`)
    console.error(`❌ REDIRECT API: Error name: ${error instanceof Error ? error.name : "Unknown"}`)
    console.error(`❌ REDIRECT API: Error message: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`❌ REDIRECT API: Error stack:`, error instanceof Error ? error.stack : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
