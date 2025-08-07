"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore"

export interface ClickHistoryItem {
  id: string
  timestamp: Timestamp
  userAgent?: string
  referer?: string
  ip?: string
  'User-Agent'?: string
  'X-Forwarded-For'?: string
}

export function useClickHistory(shortCode: string, limitCount: number = 100) {
  const [clickHistory, setClickHistory] = useState<ClickHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      setError("No short code provided")
      return
    }

    console.log(`🔄 useClickHistory: Setting up for shortCode: ${shortCode}`)
    setLoading(true)
    setError(null)

    // Set up real-time subscription for click history
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const clicksQuery = query(
      clicksRef,
      orderBy("timestamp", "desc"),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      clicksQuery,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        console.log(`📊 useClickHistory: Received ${snapshot.docs.length} clicks for ${shortCode}`)
        
        const clicks: ClickHistoryItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ClickHistoryItem[]

        setClickHistory(clicks)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`❌ useClickHistory: Error subscribing to clicks for ${shortCode}:`, err)
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
