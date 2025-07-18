"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Shield, ShieldCheck, UserX, Key, Trash2 } from "lucide-react"
import {
  createAdminUser,
  getAllAdmins,
  updateAdminUser,
  deleteAdminUser,
  changeAdminPassword,
  type AdminUser,
} from "@/lib/admin-auth"

interface AdminUserManagementProps {
  currentAdmin: AdminUser
}

export function AdminUserManagement({ currentAdmin }: AdminUserManagementProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)

  // Create admin form state
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "super_admin",
  })
  const [isCreating, setIsCreating] = useState(false)

  // Password change form state
  const [newPassword, setNewPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setIsLoading(true)
      const adminList = await getAllAdmins()
      setAdmins(adminList)
    } catch (error: any) {
      setError(error.message || "Failed to load admin users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError("")

    try {
      if (createForm.password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      await createAdminUser(
        createForm.username,
        createForm.email,
        createForm.password,
        createForm.role,
        currentAdmin.id,
      )

      setCreateForm({ username: "", email: "", password: "", role: "admin" })
      setIsCreateDialogOpen(false)
      await loadAdmins()
    } catch (error: any) {
      setError(error.message || "Failed to create admin user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (admin: AdminUser) => {
    if (admin.id === currentAdmin.id) {
      setError("You cannot deactivate your own account")
      return
    }

    try {
      await updateAdminUser(admin.id, { isActive: !admin.isActive })
      await loadAdmins()
    } catch (error: any) {
      setError(error.message || "Failed to update admin status")
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdmin) return

    setIsChangingPassword(true)
    setError("")

    try {
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      await changeAdminPassword(selectedAdmin.id, newPassword)
      setNewPassword("")
      setIsPasswordDialogOpen(false)
      setSelectedAdmin(null)
    } catch (error: any) {
      setError(error.message || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.id === currentAdmin.id) {
      setError("You cannot delete your own account")
      return
    }

    if (!confirm(`Are you sure you want to delete admin "${admin.username}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteAdminUser(admin.id)
      await loadAdmins()
    } catch (error: any) {
      setError(error.message || "Failed to delete admin user")
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Never"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  if (currentAdmin.role !== "super_admin") {
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
          <p className="text-gray-600">Manage admin users and their permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
              <DialogDescription>Create a new admin user with access to the admin dashboard.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">Username</Label>
                  <Input
                    id="create-username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    disabled={isCreating}
                    minLength={8}
                  />
                  <p className="text-sm text-gray-500">Minimum 8 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Role</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value: "admin" | "super_admin") => setCreateForm({ ...createForm, role: value })}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
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
                    "Create Admin"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Users ({admins.length})</CardTitle>
          <CardDescription>Manage admin user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
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
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.username}
                      {admin.id === currentAdmin.id && (
                        <Badge variant="outline" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                        {admin.role === "super_admin" ? (
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
                      <Badge variant={admin.isActive ? "default" : "destructive"}>
                        {admin.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(admin.createdAt)}</TableCell>
                    <TableCell>{formatDate(admin.lastLoginAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(admin)}
                          disabled={admin.id === currentAdmin.id}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setIsPasswordDialogOpen(true)
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAdmin(admin)}
                          disabled={admin.id === currentAdmin.id}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Change password for {selectedAdmin?.username}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                  minLength={8}
                />
                <p className="text-sm text-gray-500">Minimum 8 characters</p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false)
                  setSelectedAdmin(null)
                  setNewPassword("")
                }}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
