import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { getFirebase } from "./firebase"

export interface AdminUser {
  username: string
  email: string
  role: "admin" | "superadmin"
  createdAt: Date
  lastLogin?: Date
}

// Session management
const SESSION_KEY = "admin_session"

export function setSession(username: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, username)
  }
}

export function getSession(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SESSION_KEY)
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

// Password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Create admin user
export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  role: "admin" | "superadmin" = "admin",
): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebase()

  if (!db) {
    return { success: false, message: "Database connection not available" }
  }

  try {
    // Check if user already exists
    const userDoc = await getDoc(doc(db, "admins", username))
    if (userDoc.exists()) {
      return { success: false, message: "Username already exists" }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user document
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
    return { success: false, message: error.message }
  }
}

// Authenticate admin
export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  const { db } = getFirebase()

  if (!db) {
    return { success: false, message: "Database connection not available" }
  }

  try {
    const userDoc = await getDoc(doc(db, "admins", username))

    if (!userDoc.exists()) {
      return { success: false, message: "Invalid username or password" }
    }

    const userData = userDoc.data()
    const hashedPassword = await hashPassword(password)

    if (userData.password !== hashedPassword) {
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

    return { success: true, message: "Authentication successful", user }
  } catch (error: any) {
    console.error("Error authenticating admin:", error)
    return { success: false, message: error.message }
  }
}

// Get all admin users
export async function getAllAdminUsers(): Promise<{ success: boolean; users?: AdminUser[]; message: string }> {
  const { db } = getFirebase()

  if (!db) {
    return { success: false, message: "Database connection not available" }
  }

  try {
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

    return { success: true, users, message: "Users retrieved successfully" }
  } catch (error: any) {
    console.error("Error getting admin users:", error)
    return { success: false, message: error.message }
  }
}

// Update admin user
export async function updateAdminUser(
  username: string,
  updates: Partial<Pick<AdminUser, "email" | "role">>,
): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebase()

  if (!db) {
    return { success: false, message: "Database connection not available" }
  }

  try {
    const userRef = doc(db, "admins", username)
    await updateDoc(userRef, updates)
    return { success: true, message: "User updated successfully" }
  } catch (error: any) {
    console.error("Error updating admin user:", error)
    return { success: false, message: error.message }
  }
}

// Delete admin user
export async function deleteAdminUser(username: string): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebase()

  if (!db) {
    return { success: false, message: "Database connection not available" }
  }

  try {
    await deleteDoc(doc(db, "admins", username))
    return { success: true, message: "User deleted successfully" }
  } catch (error: any) {
    console.error("Error deleting admin user:", error)
    return { success: false, message: error.message }
  }
}

// Change password
export async function changePassword(
  username: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebase()

  if (!db) {
    return { success: false, message: "Database connection not available" }
  }

  try {
    const hashedPassword = await hashPassword(newPassword)
    const userRef = doc(db, "admins", username)
    await updateDoc(userRef, { password: hashedPassword })
    return { success: true, message: "Password updated successfully" }
  } catch (error: any) {
    console.error("Error changing password:", error)
    return { success: false, message: error.message }
  }
}
