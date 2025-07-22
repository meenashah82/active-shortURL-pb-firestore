import { db } from "./firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

export interface AdminUser {
  id: string
  username: string
  email: string
  role: "admin" | "superadmin"
  isActive: boolean
  createdAt: string
}

export interface AdminSession {
  userId: string
  username: string
  role: "admin" | "superadmin"
  expiresAt: number
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

export async function createAdminUser(
  username: string,
  email: string,
  password: string,
  role: "admin" | "superadmin" = "admin",
): Promise<AdminUser> {
  if (!db) {
    throw new Error("Database not initialized")
  }

  const hashedPassword = await hashPassword(password)

  const adminData = {
    username,
    email,
    password: hashedPassword,
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  const docRef = await addDoc(collection(db, "admin_users"), adminData)

  return {
    id: docRef.id,
    username,
    email,
    role,
    isActive: true,
    createdAt: adminData.createdAt,
  }
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  if (!db) {
    throw new Error("Database not initialized")
  }

  const q = query(collection(db, "admin_users"), where("username", "==", username))
  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) {
    return null
  }

  const userDoc = querySnapshot.docs[0]
  const userData = userDoc.data()

  if (!userData.isActive) {
    throw new Error("Account is deactivated")
  }

  const isValidPassword = await verifyPassword(password, userData.password)
  if (!isValidPassword) {
    return null
  }

  return {
    id: userDoc.id,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    isActive: userData.isActive,
    createdAt: userData.createdAt,
  }
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  if (!db) {
    throw new Error("Database not initialized")
  }

  const querySnapshot = await getDocs(collection(db, "admin_users"))
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    username: doc.data().username,
    email: doc.data().email,
    role: doc.data().role,
    isActive: doc.data().isActive,
    createdAt: doc.data().createdAt,
  }))
}

export async function updateAdminUser(userId: string, updates: Partial<Omit<AdminUser, "id">>): Promise<void> {
  if (!db) {
    throw new Error("Database not initialized")
  }

  const userRef = doc(db, "admin_users", userId)
  await updateDoc(userRef, updates)
}

export async function deleteAdminUser(userId: string): Promise<void> {
  if (!db) {
    throw new Error("Database not initialized")
  }

  const userRef = doc(db, "admin_users", userId)
  await deleteDoc(userRef)
}

// Session management
export function createSession(user: AdminUser): AdminSession {
  const session: AdminSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("admin_session", JSON.stringify(session))
  }

  return session
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const sessionData = localStorage.getItem("admin_session")
    if (!sessionData) {
      return null
    }

    const session: AdminSession = JSON.parse(sessionData)

    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("admin_session")
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
    localStorage.removeItem("admin_session")
  }
}
