"use client"

import { useState, useEffect, useCallback } from "react"

export interface AuthUser {
  customerId: string
  userId: string
  token: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load auth state from localStorage on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("auth")
      if (savedAuth) {
        const authData = JSON.parse(savedAuth)
        setUser(authData)
      }
    } catch (error) {
      console.error("Error loading auth from localStorage:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for Wodify token from parent window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin && !event.origin.includes("wodify.com")) {
        console.warn("Ignoring message from unknown origin:", event.origin)
        return
      }

      if (event.data?.type === "WODIFY_TOKEN" && event.data?.token) {
        console.log("🔐 Received Wodify token from parent")
        await login(event.data.token)
      }
    }

    window.addEventListener("message", handleMessage)

    // Send ready message to parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: "APP_LOADED" }, "*")
    }

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  const login = useCallback(async (wodifyToken: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔐 Validating Wodify token...")

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: wodifyToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Authentication failed")
      }

      const { jwt, user: userData } = await response.json()

      const authUser: AuthUser = {
        customerId: userData.customerId,
        userId: userData.userId,
        token: jwt,
      }

      setUser(authUser)
      localStorage.setItem("auth", JSON.stringify(authUser))

      console.log("✅ Authentication successful:", {
        customerId: userData.customerId,
        userId: userData.userId,
      })
    } catch (error) {
      console.error("❌ Login error:", error)
      setError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setError(null)
    localStorage.removeItem("auth")
    console.log("👋 User logged out")
  }, [])

  const getAuthHeaders = useCallback(() => {
    if (!user?.token) {
      return {}
    }

    return {
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "application/json",
    }
  }, [user])

  return {
    user,
    loading,
    error,
    login,
    logout,
    getAuthHeaders,
    isAuthenticated: !!user,
  }
}
