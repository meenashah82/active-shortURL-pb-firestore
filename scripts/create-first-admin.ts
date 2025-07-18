import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Simple hash function for passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_key_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function createFirstAdmin() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    // Admin details - CHANGE THESE VALUES
    const adminData = {
      username: "superadmin",
      email: "admin@makeshorturl.com",
      password: "changeme123", // CHANGE THIS PASSWORD
      role: "super_admin",
    }

    console.log("Creating first super admin user...")

    // Hash password
    const hashedPassword = await hashPassword(adminData.password)

    // Create admin document
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await setDoc(doc(db, "admins", adminId), {
      id: adminId,
      username: adminData.username,
      email: adminData.email,
      hashedPassword,
      role: adminData.role,
      isActive: true,
      createdAt: serverTimestamp(),
    })

    console.log("✅ Super admin user created successfully!")
    console.log(`Username: ${adminData.username}`)
    console.log(`Email: ${adminData.email}`)
    console.log(`Password: ${adminData.password}`)
    console.log("\n⚠️  IMPORTANT: Change the password after first login!")
    console.log("🔗 Access admin panel at: /admin")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
  }
}

createFirstAdmin()
