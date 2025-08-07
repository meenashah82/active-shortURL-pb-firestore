import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ClickEvent } from '@/lib/analytics-clean'

export function useClickHistory(shortCode: string, limitCount: number = 50) {
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    console.log(`🔄 Setting up real-time click history for: ${shortCode}`)
    setLoading(true)
    setError(null)

    const clicksRef = collection(db, 'urls', shortCode, 'clicks')
    const clicksQuery = query(
      clicksRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      clicksQuery,
      (snapshot) => {
        const clickHistory: ClickEvent[] = []
        
        snapshot.forEach((doc) => {
          const clickData = doc.data() as ClickEvent
          // Skip placeholder documents
          if (!clickData._placeholder) {
            clickHistory.push({
              ...clickData,
              id: doc.id
            })
          }
        })

        console.log(`📡 Click history update for ${shortCode}:`, {
          totalClicks: clickHistory.length,
          latestClick: clickHistory[0]?.timestamp
        })

        setClicks(clickHistory)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`❌ Error in click history subscription for ${shortCode}:`, err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => {
      console.log(`🔄 Cleaning up click history for: ${shortCode}`)
      unsubscribe()
    }
  }, [shortCode, limitCount])

  return {
    clicks,
    loading,
    error
  }
}
