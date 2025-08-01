"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  customerId: string
  userId: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  token: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    token: null,
  })

  const login = useCallback(async (wodifyToken: string): Promise<boolean> => {
    try {
      console.log("🔐 Attempting to validate token...")
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: wodifyToken }),
      })

      const data = await response.json()
      console.log("📋 Full API response:", data)
      console.log("📋 Response status:", response.status)

      if (!response.ok) {
        console.error("❌ Token validation failed:", data)
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: data.error || "Authentication failed",
          isAuthenticated: false,
        }))
        return false
      }

      if (!data.success || !data.user) {
        console.error("❌ Invalid response structure:", data)
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: "Invalid response from server",
          isAuthenticated: false,
        }))
        return false
      }

      console.log("✅ Token validation successful:", data)

      const user: User = {
        customerId: data.user.customerId,
        userId: data.user.userId,
      }

      // Store auth data
      localStorage.setItem("auth_token", data.jwt)
      localStorage.setItem("user_data", JSON.stringify(user))

      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
        token: data.jwt,
      })

      console.log("✅ Authentication state updated - user is now authenticated")
      return true
    } catch (error) {
      console.error("❌ Login error:", error)
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "Network error during authentication",
        isAuthenticated: false,
      }))
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      token: null,
    })
    console.log("👋 User logged out")
  }, [])

  const getAuthHeaders = useCallback(() => {
    const token = authState.token || localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }, [authState.token])

  // Check for existing auth on mount and listen for messages
  useEffect(() => {
    // Check for existing token
    const existingToken = localStorage.getItem("auth_token")
    const existingUser = localStorage.getItem("user_data")

    if (existingToken && existingUser) {
      try {
        const user = JSON.parse(existingUser)
        setAuthState({
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
          token: existingToken,
        })
        console.log("✅ Restored authentication from localStorage")
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        setAuthState((prev) => ({ ...prev, loading: false }))
      }
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }))
    }

    // Listen for token from parent iframe
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== "https://dev.wodify.com") {
        return
      }

      if (event.data && event.data.type === "TOKEN") {
        console.log("Received token from parent:", event.data.token)

        // Authenticate with the received token
        const success = await login(event.data.token)
        if (success) {
          console.log("Successfully authenticated with Wodify token")
        } else {
          console.error("Failed to authenticate with Wodify token")
        }
      }
    }

    // Add message listener
    window.addEventListener("message", handleMessage)

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [login])

  console.log("🔍 Current auth state:", {
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    hasUser: !!authState.user,
    hasToken: !!authState.token,
  })

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    getAuthHeaders,
  }
}
