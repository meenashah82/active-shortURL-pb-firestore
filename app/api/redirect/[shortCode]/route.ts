import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    // Find URL by shortCode
    const urlsRef = collection(db, "urls")
    const q = query(urlsRef, where("shortCode", "==", shortCode), where("isActive", "==", true))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.redirect(new URL("/not-found", request.url))
    }

    const urlDoc = querySnapshot.docs[0]
    const urlData = urlDoc.data()

    // Update analytics in the same document
    const clickEvent = {
      timestamp: serverTimestamp(),
      userAgent: request.headers.get("user-agent") || "",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      referer: request.headers.get("referer") || "",
    }

    await updateDoc(doc(db, "urls", urlDoc.id), {
      totalClicks: (urlData.totalClicks || 0) + 1,
      lastClickAt: serverTimestamp(),
      clickEvents: arrayUnion(clickEvent),
    })

    return NextResponse.redirect(urlData.originalUrl)
  } catch (error) {
    console.error("Error redirecting:", error)
    return NextResponse.redirect(new URL("/not-found", request.url))
  }
}
