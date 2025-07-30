"use client"

import { useState, useEffect } from "react"
import { subscribeToClickHistory, type IndividualClickData } from "@/lib/analytics-clean"

export function useClickHistory(shortCode: string, limitCount = 50) {
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
      (history) => {
        console.log(`📊 Click history received: ${history.length} records`)
        setClickHistory(history)
        setLoading(false)
      },
      limitCount,
    )

    return () => {
      console.log(`🧹 Cleaning up click history subscription for: ${shortCode}`)
      unsubscribe()
    }
  }, [shortCode, limitCount])

  return {
    clickHistory,
    loading,
    error,
  }
}
