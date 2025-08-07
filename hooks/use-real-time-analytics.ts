"use client"

import { useState, useEffect, useRef } from "react"
import { getUrlData, subscribeToAnalytics, type UrlData, type AnalyticsData } from "@/lib/analytics-clean"

export function useRealTimeAnalytics(shortCode: string) {
  const [urlData, setUrlData] = useState<UrlData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [clickCount, setClickCount] = useState(0)
  const [isNewClick, setIsNewClick] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const previousClickCount = useRef(0)
  const isInitialized = useRef(false)
  const newClickTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      setError("No short code provided")
      return
    }

    console.log(`🔄 useRealTimeAnalytics: Setting up for shortCode: ${shortCode}`)
    setLoading(true)
    setError(null)
    setConnectionStatus("connecting")
    isInitialized.current = false
    previousClickCount.current = 0

    // First, get the initial URL data
    const fetchInitialData = async () => {
      try {
        console.log(`🔍 useRealTimeAnalytics: Fetching initial data for: ${shortCode}`)
        const initialUrlData = await getUrlData(shortCode)

        if (!initialUrlData) {
          console.error(`❌ useRealTimeAnalytics: No URL data found for: ${shortCode}`)
          setError("Short URL not found")
          setLoading(false)
          setConnectionStatus("disconnected")
          return
        }

        console.log(`✅ useRealTimeAnalytics: Initial data loaded for: ${shortCode}`, initialUrlData)
        setUrlData(initialUrlData)
        setClickCount(initialUrlData.totalClicks || 0)
        previousClickCount.current = initialUrlData.totalClicks || 0
        setConnectionStatus("connected")
        setLoading(false)
        isInitialized.current = true
      } catch (err) {
        console.error(`❌ useRealTimeAnalytics: Error fetching initial data:`, err)
        setError(err instanceof Error ? err.message : "Failed to load analytics data")
        setLoading(false)
        setConnectionStatus("disconnected")
      }
    }

    fetchInitialData()

    // Set up real-time subscription for analytics updates
    console.log(`🔄 useRealTimeAnalytics: Setting up real-time subscription for: ${shortCode}`)
    const unsubscribe = subscribeToAnalytics(shortCode, (data) => {
      if (data) {
        console.log(`📊 useRealTimeAnalytics: Real-time update received:`, data)
        setAnalyticsData(data)

        // Check if click count increased (new click detected)
        const newClickCount = data.totalClicks || 0
        
        // Only trigger animation after initialization and if count actually increased
        if (isInitialized.current && newClickCount > previousClickCount.current) {
          console.log(`🎉 useRealTimeAnalytics: New click detected! ${previousClickCount.current} -> ${newClickCount}`)
          setIsNewClick(true)
          setLastUpdate(new Date())

          // Clear existing timeout
          if (newClickTimeout.current) {
            clearTimeout(newClickTimeout.current)
          }

          // Reset the new click indicator after 3 seconds
          newClickTimeout.current = setTimeout(() => {
            setIsNewClick(false)
          }, 3000)
        }

        setClickCount(newClickCount)
        previousClickCount.current = newClickCount
        setConnectionStatus("connected")
      } else {
        console.log(`❌ useRealTimeAnalytics: No analytics data received`)
        setConnectionStatus("disconnected")
      }
    })

    // Cleanup subscription on unmount
    return () => {
      console.log(`🧹 useRealTimeAnalytics: Cleaning up subscription for: ${shortCode}`)
      unsubscribe()
      if (newClickTimeout.current) {
        clearTimeout(newClickTimeout.current)
      }
    }
  }, [shortCode])

  return {
    urlData,
    analyticsData,
    loading,
    error,
    connectionStatus,
    clickCount,
    isNewClick,
    lastUpdate,
  }
}
