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

// Simple password hashing using Web Crypto API (no bcrypt dependency needed)
async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + "salt_shorturl_2024")
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  } catch (error) {
    console.error("Password hashing error:", error)
    throw new Error("Failed to hash password")
  }
}

export async function createAdminUser(userData: {
  username: string
  email: string
  password: string
  role: "admin" | "superadmin"
}): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    // Check if username already exists
    const userDoc = await getDoc(doc(db, "admins", userData.username))
    if (userDoc.exists()) {
      return { success: false, message: "Username already exists" }
    }

    // Check if email already exists
    const adminsSnapshot = await getDocs(collection(db, "admins"))
    const existingEmails = adminsSnapshot.docs.map((doc) => doc.data().email)
    if (existingEmails.includes(userData.email)) {
      return { success: false, message: "Email already exists" }
    }

    const hashedPassword = await hashPassword(userData.password)

    const adminUser: Omit<AdminUser, "id"> & { password: string } = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, "admins", userData.username), adminUser)

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
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    const userDoc = await getDoc(doc(db, "admins", username))

    if (!userDoc.exists()) {
      return { success: false, message: "Invalid credentials" }
    }

    const userData = userDoc.data()

    if (!userData.isActive) {
      return { success: false, message: "Account is deactivated" }
    }

    const hashedPassword = await hashPassword(password)

    if (userData.password !== hashedPassword) {
      return { success: false, message: "Invalid credentials" }
    }

    // Update last login
    await updateDoc(doc(db, "admins", username), {
      lastLogin: new Date().toISOString(),
    })

    const user: AdminUser = {
      id: username,
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

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("adminSession", JSON.stringify(session))
    } catch (error) {
      console.error("Failed to save session:", error)
    }
  }

  return session
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null

  try {
    const sessionData = localStorage.getItem("adminSession")
    if (!sessionData) return null

    const session: AdminSession = JSON.parse(sessionData)

    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("adminSession")
      return null
    }

    return session
  } catch (error) {
    console.error("Failed to get session:", error)
    localStorage.removeItem("adminSession")
    return null
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("adminSession")
    } catch (error) {
      console.error("Failed to clear session:", error)
    }
  }
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    if (!db) {
      console.error("Database not initialized")
      return []
    }

    const adminsSnapshot = await getDocs(collection(db, "admins"))
    return adminsSnapshot.docs.map((doc) => ({
      id: doc.id,
      username: doc.data().username,
      email: doc.data().email,
      role: doc.data().role,
      isActive: doc.data().isActive,
      createdAt: doc.data().createdAt,
      lastLogin: doc.data().lastLogin,
    }))
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return []
  }
}

export async function updateAdminUser(
  username: string,
  updates: Partial<{
    email: string
    role: "admin" | "superadmin"
    isActive: boolean
    password: string
  }>,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    const updateData: any = { ...updates }

    if (updates.password) {
      updateData.password = await hashPassword(updates.password)
    }

    await updateDoc(doc(db, "admins", username), updateData)

    return { success: true, message: "Admin user updated successfully" }
  } catch (error) {
    console.error("Error updating admin user:", error)
    return { success: false, message: "Failed to update admin user" }
  }
}

export async function deleteAdminUser(username: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    await deleteDoc(doc(db, "admins", username))
    return { success: true, message: "Admin user deleted successfully" }
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return { success: false, message: "Failed to delete admin user" }
  }
}
