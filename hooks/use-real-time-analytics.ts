"use client"

import { useState, useEffect, useRef } from "react"
import { subscribeToAnalytics, subscribeToUrlAnalytics, type UnifiedUrlData } from "@/lib/analytics-unified"

export function useRealTimeAnalytics(shortCode: string) {
  const [data, setData] = useState<UnifiedUrlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [clickCount, setClickCount] = useState(0)
  const [isNewClick, setIsNewClick] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const previousClickCount = useRef(0)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    console.log(`🚀 Initializing unified real-time analytics hook for: ${shortCode}`)

    if (!shortCode) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Load initial data
    async function loadInitialData() {
      try {
        console.log(`📊 Loading initial unified data for: ${shortCode}`)
        const urlResult = await subscribeToUrlAnalytics(shortCode)
        if (!urlResult) {
          setError("Short code not found")
          return
        }
        setData(urlResult)
        setClickCount(urlResult.totalClicks || 0)
        previousClickCount.current = urlResult.totalClicks || 0
        console.log("✅ Initial unified data loaded successfully")
      } catch (err) {
        console.error("❌ Error loading initial unified data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    // Set up real-time listener
    console.log("🔗 Setting up unified real-time subscription...")

    const unsubscribe = subscribeToAnalytics(shortCode, (urlData) => {
      if (urlData) {
        console.log("📡 Unified real-time analytics data received:", {
          shortCode,
          totalClicks: urlData.totalClicks,
          clickEventsCount: urlData.clickEvents?.length || 0,
        })

        setData(urlData)
        setLastUpdate(new Date())
        setConnectionStatus("connected")

        // Handle click count changes with animation
        const newClickCount = urlData.totalClicks || 0
        if (newClickCount !== previousClickCount.current) {
          console.log(`🎉 Unified real-time click update! ${previousClickCount.current} → ${newClickCount}`)

          setIsNewClick(true)
          setClickCount(newClickCount)
          previousClickCount.current = newClickCount

          // Clear previous animation timeout
          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current)
          }

          // Remove animation after 3 seconds
          animationTimeoutRef.current = setTimeout(() => {
            setIsNewClick(false)
          }, 3000)
        }
      } else {
        console.log("❌ No unified analytics data received")
        setConnectionStatus("disconnected")
      }
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      console.log(`🧹 Cleaning up unified real-time analytics hook for: ${shortCode}`)

      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [shortCode])

  return { data, loading, error, connectionStatus, clickCount, isNewClick, lastUpdate }
}
