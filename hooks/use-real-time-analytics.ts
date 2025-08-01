"use client"

import { useState, useEffect } from "react"
import { subscribeToUrlAnalytics, type UnifiedUrlData } from "@/lib/analytics-unified"

export function useRealTimeAnalytics(shortCode: string) {
  const [data, setData] = useState<UnifiedUrlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToUrlAnalytics(shortCode, (urlData) => {
      setData(urlData)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [shortCode])

  return {
    data,
    loading,
    error,
    totalClicks: data?.totalClicks || 0,
    lastClickAt: data?.lastClickAt,
    clickEvents: data?.clickEvents || [],
  }
}
