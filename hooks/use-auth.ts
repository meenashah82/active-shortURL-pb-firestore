"use client"

import { useState, useEffect, useCallback } from "react"

export interface WodifyUser {
  customerId: string
  userId: string
}

interface AuthState {
  user: WodifyUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
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
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
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

      if (!response.ok) {
        throw new Error("Authentication failed")
      }

      const data = await response.json()

      if (data.success && data.jwt && data.user) {
        localStorage.setItem("auth_token", data.jwt)
        localStorage.setItem("user_data", JSON.stringify(data.user))

        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        })

        return true
      }

      throw new Error("Invalid response from auth service")
    } catch (error) {
      console.error("Login error:", error)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    getAuthHeaders,
  }
}
