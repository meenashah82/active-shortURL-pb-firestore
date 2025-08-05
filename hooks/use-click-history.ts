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

    console.log(`🔄 useClickHistory: Setting up subscription for: ${shortCode}`)
    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToClickHistory(
      shortCode,
      (history) => {
        console.log(`📊 useClickHistory: Received ${history.length} click records`)
        setClickHistory(history)
        setLoading(false)
      },
      limit,
    )

    return () => {
      console.log(`🧹 useClickHistory: Cleaning up subscription for: ${shortCode}`)
      unsubscribe()
    }
  }, [shortCode, limit])

  return {
    clickHistory,
    loading,
    error,
  }
}
