"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AnalyticsData {
  totalClicks: number
  clicksToday: number
  clicksThisWeek: number
  clicksThisMonth: number
  recentClicks: Array<{
    id: string
    timestamp: Date
    referrer: string
    userAgent: string
    ip: string
  }>
}

export function useRealTimeAnalytics(shortCode: string) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    const urlDocRef = doc(db, "urls", shortCode)

    const unsubscribe = onSnapshot(
      urlDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          // Calculate time-based metrics
          const clicks = data.clicks || []
          const clicksToday = clicks.filter((click: any) => new Date(click.timestamp.toDate()) >= today).length

          const clicksThisWeek = clicks.filter((click: any) => new Date(click.timestamp.toDate()) >= thisWeek).length

          const clicksThisMonth = clicks.filter((click: any) => new Date(click.timestamp.toDate()) >= thisMonth).length

          const recentClicks = clicks
            .slice(-10)
            .map((click: any) => ({
              id: click.id || Math.random().toString(),
              timestamp: click.timestamp.toDate(),
              referrer: click.referrer || "Direct",
              userAgent: click.userAgent || "Unknown",
              ip: click.ip || "Unknown",
            }))
            .reverse()

          setAnalytics({
            totalClicks: data.totalClicks || 0,
            clicksToday,
            clicksThisWeek,
            clicksThisMonth,
            recentClicks,
          })
        } else {
          setError("URL not found")
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching real-time analytics:", error)
        setError("Failed to load analytics")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [shortCode])

  return { analytics, loading, error }
}
