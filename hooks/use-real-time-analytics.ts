"use client"

import { useState, useEffect } from "react"
import { subscribeToUserUrls, subscribeToTopUrls, type UnifiedUrlData } from "@/lib/analytics-unified"
import { useAuth } from "./use-auth"

export function useRealTimeAnalytics() {
  const [userUrls, setUserUrls] = useState<UnifiedUrlData[]>([])
  const [topUrls, setTopUrls] = useState<UnifiedUrlData[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    setLoading(true)

    // Subscribe to user's URLs
    const unsubscribeUser = subscribeToUserUrls(user.customerId, (urls) => {
      setUserUrls(urls)
      setLoading(false)
    })

    // Subscribe to top URLs
    const unsubscribeTop = subscribeToTopUrls((urls) => {
      setTopUrls(urls)
    })

    return () => {
      unsubscribeUser()
      unsubscribeTop()
    }
  }, [isAuthenticated, user])

  return {
    userUrls,
    topUrls,
    loading,
  }
}
