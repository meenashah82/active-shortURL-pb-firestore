import { useState, useEffect, useRef } from 'react'
import { subscribeToAnalytics, UrlData } from '@/lib/analytics-clean'

export function useRealTimeAnalytics(shortCode: string) {
  const [data, setData] = useState<UrlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [clickAnimation, setClickAnimation] = useState(false)
  const previousClicksRef = useRef<number>(0)

  useEffect(() => {
    if (!shortCode) {
      setLoading(false)
      return
    }

    console.log(`🔄 Setting up real-time analytics for: ${shortCode}`)
    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToAnalytics(shortCode, (urlData) => {
      if (urlData) {
        console.log(`📡 Real-time analytics update:`, {
          shortCode,
          totalClicks: urlData.totalClicks,
          previousClicks: previousClicksRef.current
        })

        // Trigger animation if clicks increased
        if (urlData.totalClicks > previousClicksRef.current) {
          console.log(`🎉 New click detected! ${previousClicksRef.current} -> ${urlData.totalClicks}`)
          setClickAnimation(true)
          setTimeout(() => setClickAnimation(false), 1000)
        }

        previousClicksRef.current = urlData.totalClicks
        setData(urlData)
        setIsConnected(true)
        setError(null)
      } else {
        console.log(`❌ No data received for: ${shortCode}`)
        setError('URL not found')
        setIsConnected(false)
      }
      setLoading(false)
    })

    return () => {
      console.log(`🔄 Cleaning up real-time analytics for: ${shortCode}`)
      unsubscribe()
    }
  }, [shortCode])

  return {
    data,
    loading,
    error,
    isConnected,
    clickAnimation,
    totalClicks: data?.totalClicks || 0
  }
}
