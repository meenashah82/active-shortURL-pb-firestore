"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  customerId: string
  userId: string
  token: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  })

  const login = useCallback(async (token: string): Promise<boolean> => {
    try {
      console.log("Attempting to validate token:", token.substring(0, 20) + "...")

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Token validation failed:", errorData)
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorData.error || "Authentication failed",
          isAuthenticated: false,
        }))
        return false
      }

      const data = await response.json()
      console.log("Token validation successful:", data)

      const user: User = {
        customerId: data.customerId,
        userId: data.userId,
        token: data.jwt,
      }

      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      })

      // Store JWT for future requests
      localStorage.setItem("auth_token", data.jwt)
      console.log("Authentication successful, user logged in")
      return true
    } catch (error) {
      console.error("Login error:", error)
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
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    })
    console.log("User logged out")
  }, [])

  const getAuthHeaders = useCallback(() => {
    const token = authState.user?.token || localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }, [authState.user?.token])

  // Check for existing token on mount
  useEffect(() => {
    const existingToken = localStorage.getItem("auth_token")
    if (existingToken) {
      // Verify the existing token is still valid
      fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jwt: existingToken }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.customerId && data.userId) {
            const user: User = {
              customerId: data.customerId,
              userId: data.userId,
              token: existingToken,
            }
            setAuthState({
              user,
              loading: false,
              error: null,
              isAuthenticated: true,
            })
            console.log("Restored authentication from stored token")
          } else {
            setAuthState((prev) => ({ ...prev, loading: false }))
          }
        })
        .catch(() => {
          localStorage.removeItem("auth_token")
          setAuthState((prev) => ({ ...prev, loading: false }))
        })
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  return {
    ...authState,
    login,
    logout,
    getAuthHeaders,
  }
}
