"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore"
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
}

export function useClickHistory(shortCode: string, limitCount: number = 50) {
  const [clickHistory, setClickHistory] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    console.log(`🔄 useClickHistory: Setting up real-time subscription for: ${shortCode}`)
    setLoading(true)
    setError(null)

    // Subscribe to clicks subcollection for real-time updates
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const clicksQuery = query(
      clicksRef,
      where("_placeholder", "!=", true), // Exclude placeholder documents
      orderBy("timestamp", "desc"),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      clicksQuery,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        console.log(`📊 useClickHistory: Real-time click update received for ${shortCode}`)
        
        const clicks: ClickEvent[] = []
        snapshot.forEach((doc) => {
          const clickData = doc.data() as ClickEvent
          // Skip placeholder documents
          if (!clickData._placeholder) {
            clicks.push({
              id: doc.id,
              ...clickData,
            })
          }
        })

        console.log(`📊 useClickHistory: Processed ${clicks.length} clicks for ${shortCode}`)
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
