"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trash2,
  ExternalLink,
  AlertTriangle,
  Users,
  Link,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Activity,
  TrendingUp,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore"
import { type AdminUser, clearAdminSession, getAllAdminUsers } from "@/lib/admin-auth"
import { AdminUserManagement } from "./admin-user-management"

interface UrlData {
  id: string
  shortCode: string
  originalUrl: string
  createdAt: string
  totalClicks: number
  isActive: boolean
}

interface AdminDashboardProps {
  user: AdminUser
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [filteredUrls, setFilteredUrls] = useState<UrlData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLinks: 0,
    totalClicks: 0,
    activeUsers: 0,
  })
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchUrls = async () => {
    if (!db) {
      setError("Firebase is not initialized. Check environment variables.")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const urlsRef = collection(db, "urls")
      const urlsQuery = query(urlsRef, orderBy("createdAt", "desc"), limit(100))
      const querySnapshot = await getDocs(urlsQuery)

      const urlsData: UrlData[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        urlsData.push({
          id: doc.id,
          shortCode: data.shortCode || "",
          originalUrl: data.originalUrl || "",
          createdAt: data.createdAt || "",
          totalClicks: data.totalClicks || 0,
          isActive: data.isActive !== false,
        })
      })

      setUrls(urlsData)
      setFilteredUrls(urlsData)
      setError(null)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      setError(`Failed to fetch URLs: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, shortCode: string) => {
    if (!db) {
      setError("Firebase is not initialized")
      return
    }

    try {
      await deleteDoc(doc(db, "urls", id))
      setUrls((prev) => prev.filter((url) => url.id !== id))
      setFilteredUrls((prev) => prev.filter((url) => url.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting URL:", error)
      setError(`Failed to delete URL: ${error}`)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setFilteredUrls(urls)
    } else {
      const filtered = urls.filter(
        (url) =>
          url.shortCode.toLowerCase().includes(term.toLowerCase()) ||
          url.originalUrl.toLowerCase().includes(term.toLowerCase()),
      )
      setFilteredUrls(filtered)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load admin users
      const users = await getAllAdminUsers()
      setAdminUsers(users)

      // TODO: Load actual stats from your collections
      setStats({
        totalUsers: users.length,
        totalLinks: 0, // Load from your links collection
        totalClicks: 0, // Load from your analytics
        activeUsers: users.filter((u) => u.isActive).length,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    clearAdminSession()
    onLogout()
  }

  useEffect(() => {
    fetchUrls()
    loadDashboardData()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">URL Shortener Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>{user.role}</Badge>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admin Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLinks}</div>
              <p className="text-xs text-muted-foreground">Shortened URLs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClicks}</div>
              <p className="text-xs text-muted-foreground">All time clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">System initialized</p>
                        <p className="text-sm text-muted-foreground">Admin dashboard is ready</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Link className="mr-2 h-4 w-4" />
                    View Links
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="mr-2 h-4 w-4" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading URLs...</p>
              </div>
            ) : filteredUrls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No URLs match your search" : "No URLs found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Short Code</TableHead>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUrls.map((url) => (
                      <TableRow key={url.id}>
                        <TableCell className="font-mono">
                          <a
                            href={`/${url.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {url.shortCode}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={url.originalUrl}>
                          {url.originalUrl}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{url.totalClicks}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={url.isActive ? "default" : "destructive"}>
                            {url.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {url.createdAt ? new Date(url.createdAt).toLocaleDateString() : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete URL</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete the short URL "{url.shortCode}"? This action cannot be
                                  undone.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleDelete(url.id, url.shortCode)}>
                                  Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <AdminUserManagement currentUser={user} onUsersChange={loadDashboardData} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Detailed analytics and reporting will be available here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
