"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, Shield, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import {
  createAdminUser,
  getAllAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getSession,
  type AdminUser,
} from "@/lib/admin-auth"

export function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)

  // Form states
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  })

  const session = getSession()
  const isSuperAdmin = session?.role === "superadmin"

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const adminUsers = await getAllAdminUsers()
      setUsers(adminUsers)

      // Set current user
      if (session) {
        const current = adminUsers.find((u) => u.username === session.username)
        setCurrentUser(current || null)
      }
    } catch (error) {
      toast.error("Failed to load admin users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const result = await createAdminUser(newUser)

      if (result.success) {
        toast.success("Admin user created successfully")
        setShowCreateDialog(false)
        setNewUser({ username: "", email: "", password: "", role: "admin" })
        loadUsers()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to create admin user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (username: string, isActive: boolean) => {
    if (username === session?.username) {
      toast.error("Cannot deactivate your own account")
      return
    }

    try {
      const result = await updateAdminUser(username, { isActive: !isActive })

      if (result.success) {
        toast.success(`User ${!isActive ? "activated" : "deactivated"} successfully`)
        loadUsers()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  const handleDeleteUser = async (username: string) => {
    if (username === session?.username) {
      toast.error("Cannot delete your own account")
      return
    }

    if (!confirm("Are you sure you want to delete this admin user? This action cannot be undone.")) {
      return
    }

    try {
      const result = await deleteAdminUser(username)

      if (result.success) {
        toast.success("Admin user deleted successfully")
        loadUsers()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to delete admin user")
    }
  }

  const handleChangePassword = async (username: string) => {
    const newPassword = prompt("Enter new password (minimum 8 characters):")

    if (!newPassword) return

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    try {
      const result = await updateAdminUser(username, { password: newPassword })

      if (result.success) {
        toast.success("Password updated successfully")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to update password")
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>You need Super Admin privileges to manage admin users.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin User Management</h2>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Admin User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
              <DialogDescription>Add a new administrator to the system</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  disabled={isCreating}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: "admin" | "superadmin") => setNewUser({ ...newUser, role: value })}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>Manage all administrator accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                      {user.username === session?.username && (
                        <Badge variant="outline" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
                        {user.role === "superadmin" ? (
                          <>
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Super Admin
                          </>
                        ) : (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(user.username, user.isActive)}
                          disabled={user.username === session?.username}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleChangePassword(user.username)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={user.username === session?.username}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
