"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  customerId: string
  userId: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } else {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  const login = useCallback(async (wodifyToken: string): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: wodifyToken }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store JWT and user data
        localStorage.setItem("auth_token", data.jwt)
        localStorage.setItem("user_data", JSON.stringify(data.user))

        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        })

        return true
      } else {
        console.error("Authentication failed:", data.error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token")
    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        }
  }, [])

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    getAuthHeaders,
  }
}
