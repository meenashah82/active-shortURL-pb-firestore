import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface AdminUser {
  id: string
  username: string
  email: string
  role: "super_admin" | "admin"
  isActive: boolean
  createdAt: any
  lastLoginAt?: any
  createdBy?: string
}

export interface AdminSession {
  adminId: string
  username: string
  role: string
  expiresAt: number
}

// Simple hash function for passwords (in production, use bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_key_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const inputHash = await hashPassword(password)
  return inputHash === hashedPassword
}

// Create admin user
export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  role: "super_admin" | "admin" = "admin",
  createdBy?: string,
): Promise<AdminUser> {
  try {
    // Check if username already exists
    const usernameQuery = query(collection(db, "admins"), where("username", "==", username))
    const usernameSnapshot = await getDocs(usernameQuery)

    if (!usernameSnapshot.empty) {
      throw new Error("Username already exists")
    }

    // Check if email already exists
    const emailQuery = query(collection(db, "admins"), where("email", "==", email))
    const emailSnapshot = await getDocs(emailQuery)

    if (!emailSnapshot.empty) {
      throw new Error("Email already exists")
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin document
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const adminData: AdminUser & { hashedPassword: string } = {
      id: adminId,
      username,
      email,
      role,
      isActive: true,
      createdAt: serverTimestamp(),
      createdBy,
      hashedPassword,
    }

    await setDoc(doc(db, "admins", adminId), adminData)

    // Return admin data without password
    const { hashedPassword: _, ...adminUser } = adminData
    return adminUser as AdminUser
  } catch (error) {
    console.error("Error creating admin user:", error)
    throw error
  }
}

// Authenticate admin
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    // Find admin by username
    const adminQuery = query(collection(db, "admins"), where("username", "==", username))
    const adminSnapshot = await getDocs(adminQuery)

    if (adminSnapshot.empty) {
      return null
    }

    const adminDoc = adminSnapshot.docs[0]
    const adminData = adminDoc.data()

    // Check if admin is active
    if (!adminData.isActive) {
      throw new Error("Admin account is deactivated")
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, adminData.hashedPassword)
    if (!isValidPassword) {
      return null
    }

    // Update last login
    await updateDoc(doc(db, "admins", adminDoc.id), {
      lastLoginAt: serverTimestamp(),
    })

    // Return admin data without password
    const { hashedPassword: _, ...adminUser } = adminData
    return adminUser as AdminUser
  } catch (error) {
    console.error("Error authenticating admin:", error)
    throw error
  }
}

// Get admin by ID
export async function getAdminById(adminId: string): Promise<AdminUser | null> {
  try {
    const adminDoc = await getDoc(doc(db, "admins", adminId))

    if (!adminDoc.exists()) {
      return null
    }

    const adminData = adminDoc.data()
    const { hashedPassword: _, ...adminUser } = adminData
    return adminUser as AdminUser
  } catch (error) {
    console.error("Error getting admin by ID:", error)
    return null
  }
}

// Get all admin users
export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const adminsQuery = query(collection(db, "admins"))
    const adminsSnapshot = await getDocs(adminsQuery)

    const admins: AdminUser[] = []
    adminsSnapshot.docs.forEach((doc) => {
      const adminData = doc.data()
      const { hashedPassword: _, ...adminUser } = adminData
      admins.push(adminUser as AdminUser)
    })

    return admins.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
  } catch (error) {
    console.error("Error getting all admins:", error)
    throw error
  }
}

// Update admin user
export async function updateAdminUser(
  adminId: string,
  updates: Partial<Pick<AdminUser, "email" | "role" | "isActive">>,
): Promise<void> {
  try {
    await updateDoc(doc(db, "admins", adminId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating admin user:", error)
    throw error
  }
}

// Delete admin user
export async function deleteAdminUser(adminId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "admins", adminId))
  } catch (error) {
    console.error("Error deleting admin user:", error)
    throw error
  }
}

// Change admin password
export async function changeAdminPassword(adminId: string, newPassword: string): Promise<void> {
  try {
    const hashedPassword = await hashPassword(newPassword)
    await updateDoc(doc(db, "admins", adminId), {
      hashedPassword,
      passwordChangedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error changing admin password:", error)
    throw error
  }
}

// Session management
export function createSession(admin: AdminUser): AdminSession {
  return {
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
}

export function isSessionValid(session: AdminSession): boolean {
  return Date.now() < session.expiresAt
}
