"use client"

import { useState, useEffect } from "react"

export interface AuthUser {
  customerId: string
  userId: string
}

export interface AuthState {
  user: AuthUser | null
  jwt: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    jwt: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Check for existing JWT in localStorage
    const storedJWT = localStorage.getItem("jwt")
    const storedUser = localStorage.getItem("user")

    if (storedJWT && storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setAuthState({
          user,
          jwt: storedJWT,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("jwt")
        localStorage.removeItem("user")
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (wodifyToken: string): Promise<boolean> => {
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

      if (data.success) {
        localStorage.setItem("jwt", data.jwt)
        localStorage.setItem("user", JSON.stringify(data.user))

        setAuthState({
          user: data.user,
          jwt: data.jwt,
          isLoading: false,
          isAuthenticated: true,
        })

        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("jwt")
    localStorage.removeItem("user")
    setAuthState({
      user: null,
      jwt: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  const getAuthHeaders = () => {
    if (authState.jwt) {
      return {
        Authorization: `Bearer ${authState.jwt}`,
        "Content-Type": "application/json",
      }
    }
    return {
      "Content-Type": "application/json",
    }
  }

  return {
    ...authState,
    login,
    logout,
    getAuthHeaders,
  }
}
