import { type NextRequest, NextResponse } from "next/server"
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, addDoc, collection, Timestamp } from 'firebase/firestore'

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    console.log(`API redirect for: ${shortCode}`)

    // Get URL data directly
    const urlRef = doc(db, "urls", shortCode)
    const urlDoc = await getDoc(urlRef)

    if (!urlDoc.exists()) {
      console.log(`Short code not found: ${shortCode}`)
      return NextResponse.json({ error: "Short URL not found" }, { status: 404 })
    }

    const urlData = urlDoc.data()
    console.log(`Found URL: ${shortCode} -> ${urlData.originalUrl}`)

    // Extract all headers for detailed click tracking
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Record the click with all headers
    const userAgent = request.headers.get("user-agent") || "Unknown"
    const referer = request.headers.get("referer") || "Direct"
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "Unknown"

    // Record click in subcollection (fire and forget)
    Promise.resolve().then(async () => {
      try {
        // Create click document in the subcollection urls/{shortCode}/clicks
        const clicksRef = collection(db, "urls", shortCode, "clicks")
        
        const clickEvent = {
          timestamp: Timestamp.now(),
          shortCode: shortCode,
          "User-Agent": headers["user-agent"] || userAgent,
          Referer: headers["referer"] || referer,
          "X-Forwarded-For": headers["x-forwarded-for"] || ip,
          Host: headers["host"],
          Accept: headers["accept"],
          "Accept-Language": headers["accept-language"],
          "Accept-Encoding": headers["accept-encoding"],
          "Accept-Charset": headers["accept-charset"],
          "Content-Type": headers["content-type"],
          "Content-Length": headers["content-length"],
          Authorization: headers["authorization"],
          Cookie: headers["cookie"],
          Origin: headers["origin"],
          Connection: headers["connection"],
          "Upgrade-Insecure-Requests": headers["upgrade-insecure-requests"],
          "Cache-Control": headers["cache-control"],
          Pragma: headers["pragma"],
          "If-Modified-Since": headers["if-modified-since"],
          "If-None-Match": headers["if-none-match"],
          Range: headers["range"],
          TE: headers["te"],
          "Transfer-Encoding": headers["transfer-encoding"],
          Expect: headers["expect"],
          "X-Requested-With": headers["x-requested-with"],
        }

        // Add click to subcollection (this creates a unique document ID automatically)
        await addDoc(clicksRef, clickEvent)

        // Update URL document with incremented click count
        await updateDoc(urlRef, {
          totalClicks: increment(1),
          lastClickAt: Timestamp.now()
        })

        console.log(`Click recorded in subcollection for: ${shortCode}`)
      } catch (error) {
        console.error(`Failed to record click for ${shortCode}:`, error)
      }
    })

    // Ensure URL has protocol
    let targetUrl = urlData.originalUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    console.log(`Redirecting ${shortCode} to: ${targetUrl}`)

    // Redirect to the original URL
    return NextResponse.redirect(targetUrl, { status: 302 })
  } catch (error) {
    console.error("Error in API redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
