"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Switch } from "@/components/ui/switch"
import { UserPlus, Edit, Trash2, RefreshCw, Shield, User } from "lucide-react"
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  changePassword,
  getSession,
  type AdminUser,
} from "@/lib/admin-auth"

export function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)

  // Create user form
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  })
  const [isCreating, setIsCreating] = useState(false)

  // Edit user form
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "admin" as "admin" | "superadmin",
    isActive: true,
  })

  // Change password form
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    userId: "",
    newPassword: "",
    confirmPassword: "",
  })

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Fetching admin users...")

      const usersData = await getAllAdminUsers()
      console.log("Fetched users:", usersData)

      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const result = await createAdminUser(createForm.username, createForm.email, createForm.password, createForm.role)

      if (result.success) {
        setCreateForm({ username: "", email: "", password: "", role: "admin" })
        setShowCreateDialog(false)
        await fetchUsers()
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      setError(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setError(null)

    try {
      const result = await updateAdminUser(editingUser.id, {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      })

      if (result.success) {
        setShowEditDialog(false)
        setEditingUser(null)
        await fetchUsers()
      } else {
        setError(result.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Failed to update user")
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      setError("You cannot delete your own account")
      return
    }

    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return
    }

    setError(null)

    try {
      const result = await deleteAdminUser(user.id)

      if (result.success) {
        await fetchUsers()
      } else {
        setError(result.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      setError("Failed to delete user")
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setError(null)

    try {
      const result = await changePassword(passwordForm.userId, passwordForm.newPassword)

      if (result.success) {
        setPasswordForm({ userId: "", newPassword: "", confirmPassword: "" })
        setShowPasswordDialog(false)
      } else {
        setError(result.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Failed to change password")
    }
  }

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    setShowEditDialog(true)
  }

  const openPasswordDialog = (userId: string) => {
    setPasswordForm({ userId, newPassword: "", confirmPassword: "" })
    setShowPasswordDialog(true)
  }

  useEffect(() => {
    // Get current user session first
    const session = getSession()
    if (session) {
      setCurrentUser({
        id: session.userId,
        username: session.username,
        email: "",
        role: session.role,
        isActive: true,
        createdAt: "",
      })
    }

    // Then fetch users
    fetchUsers()
  }, [])

  const canManageUsers = currentUser?.role === "superadmin" || currentUser?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#4D475B" }}>
            User Management
          </h2>
          <p style={{ color: "#94909C" }}>Manage admin users and permissions</p>
        </div>
        {canManageUsers ? (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
              <DialogHeader>
                <DialogTitle style={{ color: "#4D475B" }}>Create New Admin User</DialogTitle>
                <DialogDescription style={{ color: "#94909C" }}>
                  Add a new administrator to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username" style={{ color: "#4D475B" }}>
                    Username
                  </Label>
                  <Input
                    id="create-username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    required
                    style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email" style={{ color: "#4D475B" }}>
                    Email
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password" style={{ color: "#4D475B" }}>
                    Password
                  </Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role" style={{ color: "#4D475B" }}>
                    Role
                  </Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value: "admin" | "superadmin") => setCreateForm({ ...createForm, role: value })}
                  >
                    <SelectTrigger style={{ borderColor: "#D9D8FD", color: "#4D475B" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full"
                  style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}
                >
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            onClick={fetchUsers}
            disabled={isLoading}
            variant="outline"
            style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" style={{ borderColor: "#F22C7C", backgroundColor: "rgba(242, 44, 124, 0.1)" }}>
          <AlertDescription style={{ color: "#F22C7C" }}>{error}</AlertDescription>
        </Alert>
      )}

      <Card style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4D475B" }}>Admin Users ({users.length})</CardTitle>
          <CardDescription style={{ color: "#94909C" }}>Manage administrator accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#833ADF" }}></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#94909C" }}>
              <p>No admin users found</p>
              <p className="text-sm mt-2">Create your first admin user to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: "#94909C" }}>User</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Email</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Role</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Status</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Created</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.role === "superadmin" ? (
                            <Shield className="h-4 w-4" style={{ color: "#833ADF" }} />
                          ) : (
                            <User className="h-4 w-4" style={{ color: "#94909C" }} />
                          )}
                          <span className="font-medium" style={{ color: "#4D475B" }}>
                            {user.username}
                          </span>
                          {user.id === currentUser?.id && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: "#D9D8FD", color: "#833ADF" }}
                            >
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ color: "#4D475B" }}>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === "superadmin" ? "default" : "secondary"}
                          style={{
                            backgroundColor: user.role === "superadmin" ? "#833ADF" : "#D9D8FD",
                            color: user.role === "superadmin" ? "#FFFFFF" : "#833ADF",
                          }}
                        >
                          {user.role === "superadmin" ? "Super Admin" : "Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                          style={{
                            backgroundColor: user.isActive ? "#833ADF" : "#F22C7C",
                            color: "#FFFFFF",
                          }}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: "#94909C" }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {canManageUsers && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                                style={{ color: "#833ADF" }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPasswordDialog(user.id)}
                                style={{ color: "#833ADF" }}
                              >
                                <span className="text-xs">Change Password</span>
                              </Button>
                              {user.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  style={{ color: "#F22C7C" }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4D475B" }}>Edit User</DialogTitle>
            <DialogDescription style={{ color: "#94909C" }}>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username" style={{ color: "#4D475B" }}>
                Username
              </Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                required
                style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" style={{ color: "#4D475B" }}>
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
                style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" style={{ color: "#4D475B" }}>
                Role
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "admin" | "superadmin") => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger style={{ borderColor: "#D9D8FD", color: "#4D475B" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
              <Label htmlFor="edit-active" style={{ color: "#4D475B" }}>
                Active
              </Label>
            </div>
            <Button type="submit" className="w-full" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
              Update User
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#4D475B" }}>Change Password</DialogTitle>
            <DialogDescription style={{ color: "#94909C" }}>Set a new password for this user</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" style={{ color: "#4D475B" }}>
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" style={{ color: "#4D475B" }}>
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
              />
            </div>
            <Button type="submit" className="w-full" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
              Change Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
