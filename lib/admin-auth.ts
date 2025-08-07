import { getFirebase } from "./firebase"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

export interface AdminUser {
  id: string
  username: string
  email: string
  role: "admin" | "superadmin"
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export interface AdminSession {
  userId: string
  username: string
  role: "admin" | "superadmin"
  expiresAt: number
}

const ADMIN_COLLECTION = "admins"
const SESSION_KEY = "adminSession"

// Password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
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

// Session Management
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

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    clearSession()
    return null
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

// Create admin user
export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  role: "admin" | "superadmin" = "admin",
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  try {
    const { db } = getFirebase()

    if (!db) {
      console.error("Database not available")
      return {
        success: false,
        message: "Database connection not available. Please check Firebase configuration.",
      }
    }

    // Check if username already exists
    const usernameQuery = query(collection(db, ADMIN_COLLECTION), where("username", "==", username))
    const usernameSnapshot = await getDocs(usernameQuery)

    if (!usernameSnapshot.empty) {
      return {
        success: false,
        message: "Username already exists",
      }
    }

    // Check if email already exists
    const emailQuery = query(collection(db, ADMIN_COLLECTION), where("email", "==", email))
    const emailSnapshot = await getDocs(emailQuery)

    if (!emailSnapshot.empty) {
      return {
        success: false,
        message: "Email already exists",
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user document
    const userId = username.toLowerCase()
    const adminUser: AdminUser = {
      id: userId,
      username,
      email,
      role,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    // Save to Firestore
    await setDoc(doc(db, ADMIN_COLLECTION, userId), {
      ...adminUser,
      password: hashedPassword,
    })

    return {
      success: true,
      message: "Admin user created successfully",
      user: adminUser,
    }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return {
      success: false,
      message: "Failed to create admin user",
    }
  }
}

// Authenticate admin
export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  try {
    const { db } = getFirebase()

    if (!db) {
      console.error("Database not available")
      return {
        success: false,
        message: "Database connection not available. Please check Firebase configuration.",
      }
    }

    console.log("Attempting to authenticate user:", username)
    const userDoc = await getDoc(doc(db, ADMIN_COLLECTION, username.toLowerCase()))

    if (!userDoc.exists()) {
      console.log("User document not found for:", username)
      return {
        success: false,
        message: "Invalid username or password",
      }
    }

    const userData = userDoc.data()
    console.log("User data found:", { username: userData.username, isActive: userData.isActive })

    if (!userData.isActive) {
      return {
        success: false,
        message: "Account is deactivated",
      }
    }

    const isValidPassword = await verifyPassword(password, userData.password)
    console.log("Password verification result:", isValidPassword)

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid username or password",
      }
    }

    // Update last login
    await updateDoc(doc(db, ADMIN_COLLECTION, username.toLowerCase()), {
      lastLogin: new Date().toISOString(),
    })

    const user: AdminUser = {
      id: userDoc.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt,
      lastLogin: new Date().toISOString(),
      isActive: userData.isActive,
    }

    console.log("Authentication successful for user:", user.username)

    return {
      success: true,
      message: "Authentication successful",
      user,
    }
  } catch (error) {
    console.error("Error authenticating admin:", error)
    return {
      success: false,
      message: "Authentication failed",
    }
  }
}

// Get all admin users
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    const { db } = getFirebase()

    if (!db) {
      console.error("Database connection not available")
      return []
    }

    const snapshot = await getDocs(collection(db, ADMIN_COLLECTION))
    const users: AdminUser[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        username: data.username,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        isActive: data.isActive,
      })
    })

    return users
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return []
  }
}

// Update admin user
export async function updateAdminUser(
  userId: string,
  updates: Partial<Pick<AdminUser, "username" | "email" | "role" | "isActive">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = getFirebase()

    if (!db) {
      return {
        success: false,
        error: "Database connection not available",
      }
    }

    await updateDoc(doc(db, ADMIN_COLLECTION, userId), updates)
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating admin user:", error)
    return {
      success: false,
      error: "Failed to update user",
    }
  }
}

// Delete admin user
export async function deleteAdminUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = getFirebase()

    if (!db) {
      return {
        success: false,
        error: "Database connection not available",
      }
    }

    await deleteDoc(doc(db, ADMIN_COLLECTION, userId))
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return {
      success: false,
      error: "Failed to delete user",
    }
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
      return {
        success: false,
        error: "Database connection not available",
      }
    }

    const hashedPassword = await hashPassword(newPassword)
    await updateDoc(doc(db, ADMIN_COLLECTION, userId), {
      password: hashedPassword,
    })
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error changing password:", error)
    return {
      success: false,
      error: "Failed to change password",
    }
  }
}
