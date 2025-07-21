import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import bcrypt from "bcryptjs"

export interface AdminUser {
  id?: string
  username: string
  email: string
  role: "admin" | "superadmin"
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
  createdBy?: string
}

export interface CreateAdminUserData {
  username: string
  email: string
  password: string
  role: "admin" | "superadmin"
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResult {
  success: boolean
  message: string
  user?: AdminUser
}

// Collection reference
const ADMIN_COLLECTION = "admin_users"

export async function createAdminUser(userData: CreateAdminUserData): Promise<AuthResult> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    // Check if username already exists
    const usernameQuery = query(collection(db, ADMIN_COLLECTION), where("username", "==", userData.username))
    const usernameSnapshot = await getDocs(usernameQuery)

    if (!usernameSnapshot.empty) {
      return { success: false, message: "Username already exists" }
    }

    // Check if email already exists
    const emailQuery = query(collection(db, ADMIN_COLLECTION), where("email", "==", userData.email))
    const emailSnapshot = await getDocs(emailQuery)

    if (!emailSnapshot.empty) {
      return { success: false, message: "Email already exists" }
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

    // Create user document
    const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const adminUser: AdminUser & { password: string } = {
      id: userId,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      isActive: true,
      createdAt: new Date(),
    }

    await setDoc(doc(db, ADMIN_COLLECTION, userId), {
      ...adminUser,
      createdAt: Timestamp.fromDate(adminUser.createdAt),
    })

    // Return user without password
    const { password, ...userWithoutPassword } = adminUser
    return {
      success: true,
      message: "Admin user created successfully",
      user: userWithoutPassword,
    }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return { success: false, message: `Failed to create admin user: ${error}` }
  }
}

export async function loginAdmin(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    // Find user by username
    const userQuery = query(
      collection(db, ADMIN_COLLECTION),
      where("username", "==", credentials.username),
      where("isActive", "==", true),
    )
    const userSnapshot = await getDocs(userQuery)

    if (userSnapshot.empty) {
      return { success: false, message: "Invalid username or password" }
    }

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, userData.password)

    if (!isPasswordValid) {
      return { success: false, message: "Invalid username or password" }
    }

    // Update last login
    await updateDoc(doc(db, ADMIN_COLLECTION, userDoc.id), {
      lastLogin: Timestamp.now(),
    })

    // Return user without password
    const { password, ...userWithoutPassword } = userData
    const user: AdminUser = {
      ...userWithoutPassword,
      id: userDoc.id,
      createdAt: userData.createdAt.toDate(),
      lastLogin: new Date(),
    }

    return {
      success: true,
      message: "Login successful",
      user,
    }
  } catch (error) {
    console.error("Error during login:", error)
    return { success: false, message: `Login failed: ${error}` }
  }
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    if (!db) {
      console.error("Database not initialized")
      return []
    }

    const usersQuery = query(collection(db, ADMIN_COLLECTION), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(usersQuery)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        username: data.username,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        createdAt: data.createdAt.toDate(),
        lastLogin: data.lastLogin ? data.lastLogin.toDate() : undefined,
        createdBy: data.createdBy,
      }
    })
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return []
  }
}

export async function updateAdminUser(userId: string, updates: Partial<AdminUser>): Promise<AuthResult> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    const userRef = doc(db, ADMIN_COLLECTION, userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return { success: false, message: "User not found" }
    }

    // Convert dates to Timestamps for Firestore
    const updateData: any = { ...updates }
    if (updateData.createdAt) {
      updateData.createdAt = Timestamp.fromDate(updateData.createdAt)
    }
    if (updateData.lastLogin) {
      updateData.lastLogin = Timestamp.fromDate(updateData.lastLogin)
    }

    await updateDoc(userRef, updateData)

    return { success: true, message: "User updated successfully" }
  } catch (error) {
    console.error("Error updating admin user:", error)
    return { success: false, message: `Failed to update user: ${error}` }
  }
}

export async function deleteAdminUser(userId: string): Promise<AuthResult> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    const userRef = doc(db, ADMIN_COLLECTION, userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return { success: false, message: "User not found" }
    }

    await deleteDoc(userRef)

    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return { success: false, message: `Failed to delete user: ${error}` }
  }
}

export async function changeAdminPassword(userId: string, newPassword: string): Promise<AuthResult> {
  try {
    if (!db) {
      return { success: false, message: "Database not initialized" }
    }

    const userRef = doc(db, ADMIN_COLLECTION, userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return { success: false, message: "User not found" }
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    await updateDoc(userRef, {
      password: hashedPassword,
    })

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: `Failed to change password: ${error}` }
  }
}

// Session management
export function setAdminSession(user: AdminUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "admin_session",
      JSON.stringify({
        user,
        timestamp: Date.now(),
      }),
    )
  }
}

export function getAdminSession(): AdminUser | null {
  if (typeof window !== "undefined") {
    try {
      const session = localStorage.getItem("admin_session")
      if (session) {
        const { user, timestamp } = JSON.parse(session)
        // Session expires after 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return user
        } else {
          clearAdminSession()
        }
      }
    } catch (error) {
      console.error("Error reading admin session:", error)
      clearAdminSession()
    }
  }
  return null
}

export function clearAdminSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_session")
  }
}
