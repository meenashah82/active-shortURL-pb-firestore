import { getFirebase } from "./firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

// Types
export interface AdminUser {
  id: string
  username: string
  email: string
  role: "super_admin" | "admin"
  createdAt: Date
  lastLogin?: Date
}

export interface LoginResult {
  success: boolean
  user?: AdminUser
  error?: string
}

// Session management
let currentSession: { user: AdminUser; token: string } | null = null

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Verify password
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
}

// Create admin user
export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  role: "super_admin" | "admin" = "admin",
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database connection not available" }
    }

    // Check if user already exists
    const usersRef = collection(db, "admins")
    const usernameQuery = query(usersRef, where("username", "==", username))
    const emailQuery = query(usersRef, where("email", "==", email))

    const [usernameSnapshot, emailSnapshot] = await Promise.all([getDocs(usernameQuery), getDocs(emailQuery)])

    if (!usernameSnapshot.empty) {
      return { success: false, error: "Username already exists" }
    }

    if (!emailSnapshot.empty) {
      return { success: false, error: "Email already exists" }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const docRef = await addDoc(usersRef, {
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    })

    return { success: true, userId: docRef.id }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return { success: false, error: error.message }
  }
}

// Authenticate admin
export async function authenticateAdmin(username: string, password: string): Promise<LoginResult> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database connection not available" }
    }

    const usersRef = collection(db, "admins")
    const q = query(usersRef, where("username", "==", username))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { success: false, error: "Invalid username or password" }
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    // Verify password
    const isValidPassword = await verifyPassword(password, userData.password)
    if (!isValidPassword) {
      return { success: false, error: "Invalid username or password" }
    }

    // Update last login
    await updateDoc(userDoc.ref, {
      lastLogin: new Date(),
    })

    const user: AdminUser = {
      id: userDoc.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt.toDate(),
      lastLogin: new Date(),
    }

    // Set session
    currentSession = {
      user,
      token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    return { success: true, user }
  } catch (error: any) {
    console.error("Error authenticating admin:", error)
    return { success: false, error: error.message }
  }
}

// Get all admin users
export async function getAllAdminUsers(): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database connection not available" }
    }

    const usersRef = collection(db, "admins")
    const querySnapshot = await getDocs(usersRef)

    const users: AdminUser[] = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        username: data.username,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt.toDate(),
        lastLogin: data.lastLogin?.toDate(),
      }
    })

    return { success: true, users }
  } catch (error: any) {
    console.error("Error getting admin users:", error)
    return { success: false, error: error.message }
  }
}

// Get current session
export function getSession(): { user: AdminUser; token: string } | null {
  return currentSession
}

// Set session
export function setSession(user: AdminUser, token: string): void {
  currentSession = { user, token }
}

// Clear session
export function clearSession(): void {
  currentSession = null
}

// Update admin user
export async function updateAdminUser(
  userId: string,
  updates: Partial<Pick<AdminUser, "username" | "email" | "role">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database connection not available" }
    }

    const userRef = doc(db, "admins", userId)
    await updateDoc(userRef, updates)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating admin user:", error)
    return { success: false, error: error.message }
  }
}

// Delete admin user
export async function deleteAdminUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database connection not available" }
    }

    const userRef = doc(db, "admins", userId)
    await deleteDoc(userRef)

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting admin user:", error)
    return { success: false, error: error.message }
  }
}

// Change password
export async function changePassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database connection not available" }
    }

    const hashedPassword = await hashPassword(newPassword)
    const userRef = doc(db, "admins", userId)
    await updateDoc(userRef, {
      password: hashedPassword,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error changing password:", error)
    return { success: false, error: error.message }
  }
}
