"use client"

import { useState, useEffect, useRef } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { UrlData } from "@/lib/analytics-clean"

export function useRealTimeAnalytics(shortCode: string) {
  const [urlData, setUrlData] = useState<UrlData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [clickCount, setClickCount] = useState(0)
  const [isNewClick, setIsNewClick] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const previousClickCount = useRef<number | null>(null)
  const newClickTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!shortCode || !db) {
      setLoading(false)
      setError("No short code provided or database unavailable")
      return
    }

    console.log(`🔄 useRealTimeAnalytics: Setting up real-time subscription for: ${shortCode}`)
    setLoading(true)
    setError(null)
    setConnectionStatus("connecting")
    previousClickCount.current = null

    const urlRef = doc(db, "urls", shortCode)
    
    const unsubscribe = onSnapshot(
      urlRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UrlData
          const newClickCount = data.totalClicks || 0
          
          console.log(`📡 useRealTimeAnalytics: Real-time update received for ${shortCode}:`, {
            totalClicks: newClickCount,
            previousCount: previousClickCount.current,
            timestamp: new Date().toISOString(),
            fromCache: doc.metadata.fromCache,
            hasPendingWrites: doc.metadata.hasPendingWrites
          })

          setUrlData(data)
          setAnalyticsData(data)
          setConnectionStatus("connected")
          setLastUpdate(new Date())
          setLoading(false)
          setError(null)

          // Trigger animation for any click count change
          if (previousClickCount.current !== null && newClickCount !== previousClickCount.current) {
            console.log(`🎉 useRealTimeAnalytics: Click count changed! ${previousClickCount.current} -> ${newClickCount}`)
            setIsNewClick(true)
            
            if (newClickTimeout.current) {
              clearTimeout(newClickTimeout.current)
            }
            
            newClickTimeout.current = setTimeout(() => {
              setIsNewClick(false)
            }, 2000)
          }
          
          setClickCount(newClickCount)
          previousClickCount.current = newClickCount
        } else {
          console.log(`❌ useRealTimeAnalytics: Document not found for: ${shortCode}`)
          setError("URL not found")
          setConnectionStatus("disconnected")
          setLoading(false)
        }
      },
      (err) => {
        console.error(`❌ useRealTimeAnalytics: Error in real-time subscription for ${shortCode}:`, err)
        setError(err.message)
        setConnectionStatus("disconnected")
        setLoading(false)
      }
    )

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
