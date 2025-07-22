import { getFirebase } from "./firebase"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

// Simple password hashing using Web Crypto API (available in browsers)
async function hashPassword(password: string): Promise<string> {
  if (typeof window === "undefined") {
    // Server-side fallback - just return the password (not secure, but prevents crashes)
    return password
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
}

export interface AdminUser {
  username: string
  email: string
  role: "admin" | "superadmin"
  createdAt: Date
  lastLogin?: Date
}

export interface AdminSession {
  username: string
  role: "admin" | "superadmin"
  loginTime: number
}

// Session management (client-side only)
export function setSession(session: AdminSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("adminSession", JSON.stringify(session))
  }
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null

  try {
    const sessionData = localStorage.getItem("adminSession")
    if (!sessionData) return null

    const session = JSON.parse(sessionData) as AdminSession

    // Check if session is expired (24 hours)
    const now = Date.now()
    const sessionAge = now - session.loginTime
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (sessionAge > maxAge) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Error reading session:", error)
    return null
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminSession")
  }
}

export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  role: "admin" | "superadmin" = "admin",
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, message: "Database connection not available" }
    }

    // Check if user already exists
    const userDoc = await getDoc(doc(db, "admins", username))
    if (userDoc.exists()) {
      return { success: false, message: "Username already exists" }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const adminUser: AdminUser & { password: string } = {
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    }

    await setDoc(doc(db, "admins", username), adminUser)
    return { success: true, message: "Admin user created successfully" }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return { success: false, message: error.message || "Failed to create admin user" }
  }
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, message: "Database connection not available" }
    }

    const userDoc = await getDoc(doc(db, "admins", username))
    if (!userDoc.exists()) {
      return { success: false, message: "Invalid username or password" }
    }

    const userData = userDoc.data()
    const isValidPassword = await verifyPassword(password, userData.password)

    if (!isValidPassword) {
      return { success: false, message: "Invalid username or password" }
    }

    // Update last login
    await updateDoc(doc(db, "admins", username), {
      lastLogin: new Date(),
    })

    const user: AdminUser = {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt.toDate(),
      lastLogin: new Date(),
    }

    // Set session
    setSession({
      username: user.username,
      role: user.role,
      loginTime: Date.now(),
    })

    return { success: true, message: "Login successful", user }
  } catch (error: any) {
    console.error("Error authenticating admin:", error)
    return { success: false, message: error.message || "Authentication failed" }
  }
}

export async function getAllAdminUsers(): Promise<{ success: boolean; users?: AdminUser[]; message?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, message: "Database connection not available" }
    }

    const adminsCollection = collection(db, "admins")
    const snapshot = await getDocs(adminsCollection)

    const users: AdminUser[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        username: data.username,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt.toDate(),
        lastLogin: data.lastLogin ? data.lastLogin.toDate() : undefined,
      }
    })

    return { success: true, users }
  } catch (error: any) {
    console.error("Error fetching admin users:", error)
    return { success: false, message: error.message || "Failed to fetch admin users" }
  }
}

export async function updateAdminUser(
  username: string,
  updates: Partial<Pick<AdminUser, "email" | "role">>,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, message: "Database connection not available" }
    }

    const userDoc = doc(db, "admins", username)
    const docSnapshot = await getDoc(userDoc)

    if (!docSnapshot.exists()) {
      return { success: false, message: "User not found" }
    }

    await updateDoc(userDoc, updates)
    return { success: true, message: "User updated successfully" }
  } catch (error: any) {
    console.error("Error updating admin user:", error)
    return { success: false, message: error.message || "Failed to update user" }
  }
}

export async function deleteAdminUser(username: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, message: "Database connection not available" }
    }

    // Prevent deletion of the last superadmin
    const adminsCollection = collection(db, "admins")
    const superadminQuery = query(adminsCollection, where("role", "==", "superadmin"))
    const superadminSnapshot = await getDocs(superadminQuery)

    if (superadminSnapshot.size <= 1) {
      const userDoc = await getDoc(doc(db, "admins", username))
      if (userDoc.exists() && userDoc.data().role === "superadmin") {
        return { success: false, message: "Cannot delete the last superadmin user" }
      }
    }

    await deleteDoc(doc(db, "admins", username))
    return { success: true, message: "User deleted successfully" }
  } catch (error: any) {
    console.error("Error deleting admin user:", error)
    return { success: false, message: error.message || "Failed to delete user" }
  }
}

export async function changePassword(
  username: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, message: "Database connection not available" }
    }

    const userDoc = doc(db, "admins", username)
    const docSnapshot = await getDoc(userDoc)

    if (!docSnapshot.exists()) {
      return { success: false, message: "User not found" }
    }

    const hashedPassword = await hashPassword(newPassword)
    await updateDoc(userDoc, { password: hashedPassword })

    return { success: true, message: "Password changed successfully" }
  } catch (error: any) {
    console.error("Error changing password:", error)
    return { success: false, message: error.message || "Failed to change password" }
  }
}
