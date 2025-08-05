"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface AnalyticsData {
  totalClicks: number
  createdAt: any
  lastClickAt: any
}

export function useRealTimeAnalytics(shortCode: string) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    const analyticsRef = doc(db, "analytics", shortCode)

    const unsubscribe = onSnapshot(
      analyticsRef,
      (doc) => {
        if (doc.exists()) {
          setData(doc.data() as AnalyticsData)
        } else {
          setData(null)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching analytics:", err)
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [shortCode])

  return { data, loading, error }
}
