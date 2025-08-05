"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ClickEvent {
  id: string
  timestamp: any
  userAgent: string
  referer: string
  ip: string
  country?: string
  city?: string
}

export function useClickHistory(shortCode: string, limitCount = 50) {
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    const clicksRef = collection(db, "analytics", shortCode, "clicks")
    const q = query(clicksRef, orderBy("timestamp", "desc"), limit(limitCount))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clickData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ClickEvent[]

        setClicks(clickData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching click history:", err)
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [shortCode, limitCount])

  return { clicks, loading, error }
}
