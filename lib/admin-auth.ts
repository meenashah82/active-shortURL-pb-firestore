import { db } from "./firebase"
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where } from "firebase/firestore"

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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function setSession(user: AdminUser) {
  if (typeof window !== "undefined") {
    const session: AdminSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function getSession(): AdminSession | null {
  if (typeof window !== "undefined") {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) return null
    const session: AdminSession = JSON.parse(sessionData)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  }
  return null
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
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
    setSession(user)
    return { success: true, user, message: "Login successful." }
  } catch (error: any) {
    console.error("Authentication error:", error)
    return { success: false, message: error.message }
  }
}

export async function createAdminUser(userData: {
  username: string
  email: string
  password: string
  role: "admin" | "superadmin"
}): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: "Database service is not available." }
  try {
    const q = query(collection(db, ADMIN_COLLECTION), where("username", "==", userData.username))
    if (!(await getDocs(q)).empty) return { success: false, message: "Username already exists." }

    const hashedPassword = await hashPassword(userData.password)
    await addDoc(collection(db, ADMIN_COLLECTION), {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    })
    return { success: true, message: "Admin user created successfully." }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return { success: false, message: error.message }
  }
}

export async function getAllAdminUsers(): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
  if (!db) return { success: false, error: "Database service is not available." }
  try {
    const usersCol = collection(db, ADMIN_COLLECTION)
    const userSnapshot = await getDocs(usersCol)
    const userList = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AdminUser)
    return { success: true, users: userList }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateAdminUser(
  userId: string,
  data: Partial<{ email: string; role: string; isActive: boolean }>,
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database service is not available." }
  try {
    const userDoc = doc(db, ADMIN_COLLECTION, userId)
    await updateDoc(userDoc, data)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database service is not available." }
  try {
    await deleteDoc(doc(db, ADMIN_COLLECTION, userId))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function changePassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database service is not available." }
  try {
    const hashedPassword = await hashPassword(newPassword)
    const userDoc = doc(db, ADMIN_COLLECTION, userId)
    await updateDoc(userDoc, { password: hashedPassword })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
