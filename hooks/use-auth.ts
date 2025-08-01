"use client"

import { useState, useEffect, useCallback } from "react"

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  token: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
  })

  const login = useCallback(async (token: string): Promise<boolean> => {
    console.log("🔐 Starting login process with token:", token.substring(0, 20) + "...")

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      console.log("📡 Validation response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Validation failed:", errorText)
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return false
      }

      const data = await response.json()
      console.log("✅ Token validation successful:", data)

      // Store JWT token
      if (data.jwt) {
        localStorage.setItem("jwt", data.jwt)
        console.log("💾 JWT stored in localStorage")
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: data.user,
        token: data.jwt,
      })

      console.log("🎉 Authentication state updated - user is now authenticated")
      return true
    } catch (error) {
      console.error("❌ Login error:", error)
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("jwt")
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
    })
  }, [])

  useEffect(() => {
    console.log("🚀 useAuth: Setting up authentication listeners")

    // Check for existing JWT
    const existingJWT = localStorage.getItem("jwt")
    if (existingJWT) {
      console.log("🔍 Found existing JWT, validating...")
      // You might want to validate the existing JWT here
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: null,
        token: existingJWT,
      })
      return
    }

    // Listen for token from parent window
    const handleMessage = async (event: MessageEvent) => {
      console.log("📨 Received message:", event.data)

      if (event.data.type === "TOKEN" && event.data.token) {
        console.log("🎫 Received Wodify token from parent")
        const success = await login(event.data.token)
        if (!success) {
          console.error("❌ Failed to authenticate with received token")
        }
      }
    }

    window.addEventListener("message", handleMessage)

    // Set loading to false if no token received after a timeout
    const timeout = setTimeout(() => {
      if (!authState.isAuthenticated) {
        console.log("⏰ No token received, setting loading to false")
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    }, 5000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [login, authState.isAuthenticated])

  return {
    ...authState,
    login,
    logout,
  }
}
