import { db } from "./firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

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

const ADMIN_COLLECTION = "admins"
const SESSION_KEY = "adminSession"

// Using native Web Crypto API for password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// --- Session Management ---

export function setSession(user: AdminUser): void {
  if (typeof window === "undefined") return
  const session: AdminSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null
  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) return null
    const session: AdminSession = JSON.parse(sessionData)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch (error) {
    console.error("Failed to get session:", error)
    return null
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

// --- User Authentication & Management ---

export async function createAdminUser(userData: {
  username: string
  email: string
  password: string
  role: "admin" | "superadmin"
}): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: "Database service is not available." }
  try {
    const q = query(collection(db, ADMIN_COLLECTION), where("username", "==", userData.username))
    if (!(await getDocs(q)).empty) {
      return { success: false, message: "Username already exists." }
    }
    const hashedPassword = await hashPassword(userData.password)
    await addDoc(collection(db, ADMIN_COLLECTION), {
      ...userData,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date().toISOString(),
    })
    return { success: true, message: "Admin user created successfully." }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return { success: false, message: "Failed to create admin user." }
  }
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: AdminUser; message: string }> {
  if (!db) return { success: false, message: "Database service is not available." }
  try {
    const q = query(collection(db, ADMIN_COLLECTION), where("username", "==", username))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return { success: false, message: "Invalid credentials." }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
    if (!userData.isActive) return { success: false, message: "Account is deactivated." }

    const hashedPassword = await hashPassword(password)
    if (userData.password !== hashedPassword) return { success: false, message: "Invalid credentials." }

    await updateDoc(userDoc.ref, { lastLogin: new Date().toISOString() })
    const user: AdminUser = {
      id: userDoc.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      isActive: userData.isActive,
      createdAt: userData.createdAt,
      lastLogin: new Date().toISOString(),
    }
    return { success: true, user, message: "Login successful." }
  } catch (error) {
    console.error("Error authenticating admin:", error)
    return { success: false, message: "Authentication failed." }
  }
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  if (!db) {
    console.error("Cannot get admin users: Database not available.")
    return []
  }
  try {
    const snapshot = await getDocs(collection(db, ADMIN_COLLECTION))
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
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
  userId: string,
  updates: Partial<{ email: string; role: "admin" | "superadmin"; isActive: boolean }>,
): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: "Database service not available." }
  try {
    const userRef = doc(db, ADMIN_COLLECTION, userId)
    await updateDoc(userRef, updates)
    return { success: true, message: "User updated successfully." }
  } catch (error) {
    console.error("Error updating admin user:", error)
    return { success: false, message: "Failed to update user." }
  }
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: "Database service not available." }
  try {
    const userRef = doc(db, ADMIN_COLLECTION, userId)
    await deleteDoc(userRef)
    return { success: true, message: "User deleted successfully." }
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return { success: false, message: "Failed to delete user." }
  }
}

export async function changePassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: "Database service not available." }
  try {
    const hashedPassword = await hashPassword(newPassword)
    const userRef = doc(db, ADMIN_COLLECTION, userId)
    await updateDoc(userRef, { password: hashedPassword })
    return { success: true, message: "Password changed successfully." }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: "Failed to change password." }
  }
}
