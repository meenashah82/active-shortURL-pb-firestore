"use client"

import { useState, useEffect } from "react"
import { subscribeToClickHistory, type IndividualClickData } from "@/lib/analytics-clean"

export function useClickHistory(shortCode: string, limit = 50) {
  const [clickHistory, setClickHistory] = useState<IndividualClickData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    console.log(`🔄 Setting up click history subscription for: ${shortCode}`)
    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToClickHistory(
      shortCode,
      (clicks) => {
        console.log(`📊 Received ${clicks.length} click records for: ${shortCode}`)
        setClickHistory(clicks)
        setLoading(false)
      },
      limit,
    )

    return () => {
      console.log(`🔄 Cleaning up click history subscription for: ${shortCode}`)
      unsubscribe()
    }
  }, [shortCode, limit])

  return {
    clickHistory,
    loading,
    error,
  }
}
