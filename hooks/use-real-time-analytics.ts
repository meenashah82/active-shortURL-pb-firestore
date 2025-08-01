"use client"

import { useState, useEffect } from "react"
import { subscribeToTopUrls, type UnifiedUrlData } from "@/lib/analytics-unified"

export function useRealTimeAnalytics() {
  const [topUrls, setTopUrls] = useState<UnifiedUrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToTopUrls((urls) => {
      setTopUrls(urls)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { topUrls, loading, error }
}
