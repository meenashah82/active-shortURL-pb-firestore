"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Shield, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { type AdminUser, createAdminUser, getAllAdminUsers, updateAdminUser, deleteAdminUser } from "@/lib/admin-auth"

interface AdminUserManagementProps {
  currentUser: AdminUser
  onUsersChange: () => void
}

export function AdminUserManagement({ currentUser, onUsersChange }: AdminUserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const adminUsers = await getAllAdminUsers()
      setUsers(adminUsers)
    } catch (error) {
      setError("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const result = await createAdminUser(newUser)

      if (result.success) {
        setSuccess("User created successfully")
        setNewUser({ username: "", email: "", password: "", role: "admin" })
        setIsCreateDialogOpen(false)
        await loadUsers()
        onUsersChange()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("Failed to create user")
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setError("")
    setSuccess("")

    try {
      const result = await updateAdminUser(editingUser.id!, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
      })

      if (result.success) {
        setSuccess("User updated successfully")
        setIsEditDialogOpen(false)
        setEditingUser(null)
        await loadUsers()
        onUsersChange()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("Failed to update user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    setError("")
    setSuccess("")

    try {
      const result = await deleteAdminUser(userId)

      if (result.success) {
        setSuccess("User deleted successfully")
        await loadUsers()
        onUsersChange()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("Failed to delete user")
    }
  }

  const canManageUser = (user: AdminUser) => {
    // Superadmin can manage everyone except themselves
    // Admin can't manage anyone
    return currentUser.role === "superadmin" && user.id !== currentUser.id
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>
        {currentUser.role === "superadmin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
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
                    onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "superadmin") => setNewUser((prev) => ({ ...prev, role: value }))}
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
                <Button type="submit" className="w-full">
                  Create User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>{users.length} total users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
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
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
                      {user.role === "superadmin" ? (
                        <ShieldCheck className="mr-1 h-3 w-3" />
                      ) : (
                        <Shield className="mr-1 h-3 w-3" />
                      )}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>{user.lastLogin ? user.lastLogin.toLocaleDateString() : "Never"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {canManageUser(user) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {user.id === currentUser.id && <Badge variant="outline">You</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: "admin" | "superadmin") =>
                    setEditingUser((prev) => (prev ? { ...prev, role: value } : null))
                  }
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, isActive: e.target.checked } : null))}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                Update User
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
