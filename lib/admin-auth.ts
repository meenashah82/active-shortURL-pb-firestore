import { db } from "./firebase"
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore"

export interface AdminUser {
  id: string
  username: string
  email: string
  role: "admin" | "superadmin"
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export interface AdminSession {
  userId: string
  username: string
  role: "admin" | "superadmin"
  expiresAt: number
}

// Simple hash function for passwords (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_key_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function createAdminUser(userData: {
  username: string
  email: string
  password: string
  role: "admin" | "superadmin"
}): Promise<{ success: boolean; message: string }> {
  try {
    // Check if username already exists
    const userDoc = await getDoc(doc(db, "admin_users", userData.username))
    if (userDoc.exists()) {
      return { success: false, message: "Username already exists" }
    }

    // Check if email already exists
    const adminUsers = await getDocs(collection(db, "admin_users"))
    const emailExists = adminUsers.docs.some((doc) => doc.data().email === userData.email)
    if (emailExists) {
      return { success: false, message: "Email already exists" }
    }

    const hashedPassword = await hashPassword(userData.password)

    const adminUser: AdminUser = {
      id: userData.username,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, "admin_users", userData.username), {
      ...adminUser,
      passwordHash: hashedPassword,
    })

    return { success: true, message: "Admin user created successfully" }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return { success: false, message: "Failed to create admin user" }
  }
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{
  success: boolean
  user?: AdminUser
  message: string
}> {
  try {
    const userDoc = await getDoc(doc(db, "admin_users", username))

    if (!userDoc.exists()) {
      return { success: false, message: "Invalid credentials" }
    }

    const userData = userDoc.data()

    if (!userData.isActive) {
      return { success: false, message: "Account is deactivated" }
    }

    const hashedPassword = await hashPassword(password)

    if (userData.passwordHash !== hashedPassword) {
      return { success: false, message: "Invalid credentials" }
    }

    // Update last login
    await updateDoc(doc(db, "admin_users", username), {
      lastLogin: new Date().toISOString(),
    })

    const user: AdminUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      isActive: userData.isActive,
      createdAt: userData.createdAt,
      lastLogin: new Date().toISOString(),
    }

    return { success: true, user, message: "Login successful" }
  } catch (error) {
    console.error("Error authenticating admin:", error)
    return { success: false, message: "Authentication failed" }
  }
}

export function createSession(user: AdminUser): AdminSession {
  const session: AdminSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  localStorage.setItem("admin_session", JSON.stringify(session))
  return session
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null

  const sessionData = localStorage.getItem("admin_session")
  if (!sessionData) return null

  try {
    const session: AdminSession = JSON.parse(sessionData)

    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("admin_session")
      return null
    }

    return session
  } catch {
    localStorage.removeItem("admin_session")
    return null
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_session")
  }
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    const adminUsers = await getDocs(collection(db, "admin_users"))
    return adminUsers.docs.map((doc) => {
      const data = doc.data()
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
      }
    })
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return []
  }
}

export async function updateAdminUser(
  username: string,
  updates: Partial<AdminUser>,
): Promise<{
  success: boolean
  message: string
}> {
  try {
    await updateDoc(doc(db, "admin_users", username), updates)
    return { success: true, message: "Admin user updated successfully" }
  } catch (error) {
    console.error("Error updating admin user:", error)
    return { success: false, message: "Failed to update admin user" }
  }
}

export async function changeAdminPassword(
  username: string,
  newPassword: string,
): Promise<{
  success: boolean
  message: string
}> {
  try {
    const hashedPassword = await hashPassword(newPassword)
    await updateDoc(doc(db, "admin_users", username), {
      passwordHash: hashedPassword,
    })
    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: "Failed to change password" }
  }
}

export async function deleteAdminUser(username: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    await deleteDoc(doc(db, "admin_users", username))
    return { success: true, message: "Admin user deleted successfully" }
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return { success: false, message: "Failed to delete admin user" }
  }
}
