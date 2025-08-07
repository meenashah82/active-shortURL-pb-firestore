"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ClickEvent } from "@/lib/analytics-clean"

export function useClickHistory(shortCode: string, limitCount: number = 100) {
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

    // Set up real-time subscription to clicks subcollection
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const clicksQuery = query(
      clicksRef,
      where("_placeholder", "!=", true),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      clicksQuery,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        console.log(`📡 useClickHistory: Real-time update received for ${shortCode}`)
        const clicks: ClickEvent[] = []

        snapshot.forEach((doc) => {
          const clickData = doc.data() as ClickEvent
          if (!clickData._placeholder) {
            clicks.push({
              ...clickData,
              id: doc.id,
            })
          }
        })

        console.log(`📡 useClickHistory: ${clicks.length} clicks loaded for ${shortCode}`)
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
