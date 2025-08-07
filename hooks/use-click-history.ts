"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ClickEvent {
  id?: string
  timestamp: any
  userAgent?: string
  referer?: string
  ip?: string
  "User-Agent"?: string
  "X-Forwarded-For"?: string
  shortCode?: string
  _placeholder?: boolean
  country?: string
  acceptLanguage?: string
}

export function useClickHistory(shortCode: string, limitCount: number = 100) {
  const [clickHistory, setClickHistory] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode || !db) {
      setLoading(false)
      return
    }

    console.log(`🔄 useClickHistory: Setting up real-time subscription for: ${shortCode}`)
    setLoading(true)
    setError(null)

    // Set up real-time subscription to clicks subcollection
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const clicksQuery = query(
      clicksRef,
      orderBy("timestamp", "desc"),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      clicksQuery,
      {
        includeMetadataChanges: false // Only trigger on actual data changes
      },
      (snapshot) => {
        console.log(`📡 useClickHistory: Real-time update received for ${shortCode}, ${snapshot.docs.length} documents`)
        const clicks: ClickEvent[] = []

        snapshot.forEach((doc) => {
          const clickData = doc.data() as ClickEvent
          // Skip placeholder documents
          if (!clickData._placeholder) {
            clicks.push({
              ...clickData,
              id: doc.id,
            })
          }
        })

        console.log(`📡 useClickHistory: ${clicks.length} valid clicks loaded for ${shortCode}`)
        setClickHistory(clicks)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`❌ useClickHistory: Error in real-time subscription for ${shortCode}:`, err)
        setError(err.message)
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => {
      console.log(`🧹 useClickHistory: Cleaning up subscription for: ${shortCode}`)
      unsubscribe()
    }
  }, [shortCode, limitCount])

  return {
    clickHistory,
    loading,
    error,
  }
}
