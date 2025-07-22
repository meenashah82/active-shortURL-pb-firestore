import { getFirebase } from "./firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

// Types
export interface AdminUser {
  id: string
  username: string
  email: string
  role: "admin" | "super_admin"
  createdAt: Date
  lastLogin?: Date
}

export interface LoginResult {
  success: boolean
  user?: AdminUser
  error?: string
}

export interface CreateUserResult {
  success: boolean
  userId?: string
  error?: string
}

// Session management
let currentSession: AdminUser | null = null

export function getSession(): AdminUser | null {
  return currentSession
}

export function setSession(user: AdminUser | null): void {
  currentSession = user
}

export function clearSession(): void {
  currentSession = null
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
  role: "admin" | "super_admin" = "admin",
): Promise<CreateUserResult> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database not available" }
    }

    // Check if user already exists
    const usersRef = collection(db, "admins")
    const existingUserQuery = query(usersRef, where("username", "==", username))
    const existingUserSnapshot = await getDocs(existingUserQuery)

    if (!existingUserSnapshot.empty) {
      return { success: false, error: "Username already exists" }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user document
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    }

    const docRef = await addDoc(usersRef, newUser)
    console.log("Admin user created successfully:", docRef.id)

    return { success: true, userId: docRef.id }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return { success: false, error: error.message }
  }
}

// Authenticate admin user
export async function authenticateAdmin(username: string, password: string): Promise<LoginResult> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database not available" }
    }

    // Find user by username
    const usersRef = collection(db, "admins")
    const userQuery = query(usersRef, where("username", "==", username))
    const userSnapshot = await getDocs(userQuery)

    if (userSnapshot.empty) {
      return { success: false, error: "Invalid username or password" }
    }

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()

    // Verify password
    const hashedPassword = await hashPassword(password)
    if (userData.password !== hashedPassword) {
      return { success: false, error: "Invalid username or password" }
    }

    // Update last login
    await updateDoc(userDoc.ref, {
      lastLogin: new Date(),
    })

    // Create user object
    const user: AdminUser = {
      id: userDoc.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt.toDate(),
      lastLogin: new Date(),
    }

    // Set session
    setSession(user)

    console.log("Admin user authenticated successfully:", user.username)
    return { success: true, user }
  } catch (error: any) {
    console.error("Error authenticating admin user:", error)
    return { success: false, error: error.message }
  }
}

// Get all admin users
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    const { db } = getFirebase()
    if (!db) {
      console.error("Database not available")
      return []
    }

    const usersRef = collection(db, "admins")
    const snapshot = await getDocs(usersRef)

    const users: AdminUser[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        username: data.username,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt.toDate(),
        lastLogin: data.lastLogin ? data.lastLogin.toDate() : undefined,
      })
    })

    return users
  } catch (error: any) {
    console.error("Error getting admin users:", error)
    return []
  }
}

// Update admin user
export async function updateAdminUser(
  userId: string,
  updates: Partial<Pick<AdminUser, "username" | "email" | "role">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = getFirebase()
    if (!db) {
      return { success: false, error: "Database not available" }
    }

    const userRef = doc(db, "admins", userId)
    await updateDoc(userRef, updates)

    console.log("Admin user updated successfully:", userId)
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
      return { success: false, error: "Database not available" }
    }

    const userRef = doc(db, "admins", userId)
    await deleteDoc(userRef)

    console.log("Admin user deleted successfully:", userId)
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
      return { success: false, error: "Database not available" }
    }

    const hashedPassword = await hashPassword(newPassword)
    const userRef = doc(db, "admins", userId)
    await updateDoc(userRef, { password: hashedPassword })

    console.log("Password changed successfully for user:", userId)
    return { success: true }
  } catch (error: any) {
    console.error("Error changing password:", error)
    return { success: false, error: error.message }
  }
}
