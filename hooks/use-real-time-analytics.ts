"use client"

import { useState, useEffect } from "react"
import { subscribeToTopUrls, subscribeToUrlAnalytics, type UnifiedUrlData } from "@/lib/analytics-unified"

export function useTopUrls(limit = 10) {
  const [urls, setUrls] = useState<UnifiedUrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToTopUrls(limit, (data) => {
      setUrls(data)
      setLoading(false)
    })

    return unsubscribe
  }, [limit])

  return { urls, loading, error }
}

export function useUrlAnalytics(shortCode: string) {
  const [analytics, setAnalytics] = useState<UnifiedUrlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToUrlAnalytics(shortCode, (data) => {
      setAnalytics(data)
      setLoading(false)
    })

    return unsubscribe
  }, [shortCode])

  return { analytics, loading, error }
}
