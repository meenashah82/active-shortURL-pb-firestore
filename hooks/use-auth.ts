"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  customerId: string
  userId: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  })

  console.log("🚀 useAuth: Setting up authentication listeners")

  const login = useCallback(async (token: string): Promise<boolean> => {
    try {
      console.log("🔐 Starting login process with token:", token.substring(0, 20) + "...")

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      console.log("📡 Validation response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Validation failed:", errorData)
        return false
      }

      const data = await response.json()
      console.log("✅ Token validation successful:", data)

      // Store JWT token
      if (data.jwt) {
        localStorage.setItem("jwt", data.jwt)
      }

      // Update auth state
      setAuthState({
        user: {
          customerId: data.customerId,
          userId: data.userId,
        },
        isAuthenticated: true,
        loading: false,
      })

      console.log("🎉 Authentication state updated - user is now authenticated")
      return true
    } catch (error) {
      console.error("❌ Failed to authenticate with received token", error)
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      })
      return false
    }
  }, [])

  const getAuthHeaders = useCallback(() => {
    const jwt = localStorage.getItem("jwt")
    return {
      "Content-Type": "application/json",
      ...(jwt && { Authorization: `Bearer ${jwt}` }),
    }
  }, [])

  useEffect(() => {
    // Check for existing JWT
    const existingJwt = localStorage.getItem("jwt")
    if (existingJwt) {
      // Validate existing JWT
      fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${existingJwt}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.customerId && data.userId) {
            setAuthState({
              user: {
                customerId: data.customerId,
                userId: data.userId,
              },
              isAuthenticated: true,
              loading: false,
            })
          } else {
            setAuthState({
              user: null,
              isAuthenticated: false,
              loading: false,
            })
          }
        })
        .catch(() => {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
          })
        })
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }))
    }

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      console.log("📨 Received message:", event.data)

      if (event.data && event.data.type === "TOKEN") {
        console.log("🎫 Received Wodify token from parent")
        console.log("Received token from parent:", event.data.token)
        login(event.data.token)
      }
    }

    window.addEventListener("message", handleMessage)

    // Set up timeout to stop loading if no token received
    const timeout = setTimeout(() => {
      if (authState.loading && !authState.isAuthenticated) {
        console.log("⏰ No token received, setting loading to false")
        setAuthState((prev) => ({ ...prev, loading: false }))
      }
    }, 10000) // 10 second timeout

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [login, authState.loading, authState.isAuthenticated])

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    getAuthHeaders,
    login,
  }
}
