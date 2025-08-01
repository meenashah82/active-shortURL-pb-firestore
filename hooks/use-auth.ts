"use client"

import { useState, useEffect } from "react"

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  user: any | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    user: null,
  })

  const login = async (token: string): Promise<boolean> => {
    try {
      console.log("Attempting to validate token...")

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Token validation successful:", data)

        // Store JWT token
        localStorage.setItem("jwt_token", data.jwt)

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: data.jwt,
          user: data.user,
        })

        return true
      } else {
        console.error("Token validation failed:", response.status)
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("jwt_token")
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      user: null,
    })
  }

  useEffect(() => {
    // Check for existing JWT token
    const existingToken = localStorage.getItem("jwt_token")
    if (existingToken) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        token: existingToken,
        user: null, // You might want to decode the JWT to get user info
      })
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }

    // Listen for token from parent window
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "WODIFY_TOKEN") {
        console.log("Received token from parent window")
        const success = await login(event.data.token)
        if (success) {
          console.log("Authentication successful")
        } else {
          console.log("Authentication failed")
        }
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  return {
    ...authState,
    login,
    logout,
  }
}
