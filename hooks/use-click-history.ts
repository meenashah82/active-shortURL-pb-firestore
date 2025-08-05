"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ClickEvent {
  id: string
  shortCode: string
  timestamp: Date
  referrer: string
  userAgent: string
  ip: string
  country?: string
  city?: string
}

export function useClickHistory(limitCount = 50) {
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const clicksQuery = query(collection(db, "clicks"), orderBy("timestamp", "desc"), limit(limitCount))

    const unsubscribe = onSnapshot(
      clicksQuery,
      (snapshot) => {
        const clickData: ClickEvent[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          clickData.push({
            id: doc.id,
            shortCode: data.shortCode,
            timestamp: data.timestamp.toDate(),
            referrer: data.referrer || "Direct",
            userAgent: data.userAgent || "Unknown",
            ip: data.ip || "Unknown",
            country: data.country,
            city: data.city,
          })
        })
        setClicks(clickData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching click history:", error)
        setError("Failed to load click history")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [limitCount])

  return { clicks, loading, error }
}
