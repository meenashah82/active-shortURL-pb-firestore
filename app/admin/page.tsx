"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { type AdminUser, getAdminSession } from "@/lib/admin-auth"

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const session = getAdminSession()
    setUser(session)
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    const session = getAdminSession()
    setUser(session)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />
}
