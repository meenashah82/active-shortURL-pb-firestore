import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"

// Firebase configuration - make sure these match your environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Simple hash function for passwords (matches the one in admin-auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_key_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function createFirstAdmin() {
  try {
    console.log("Creating first super admin user...")

    // CHANGE THESE CREDENTIALS BEFORE RUNNING!
    const adminData = {
      username: "superadmin",
      email: "admin@example.com",
      password: "changeme123", // CHANGE THIS!
      role: "superadmin",
    }

    console.log("⚠️  WARNING: Change the default credentials in this script before running!")
    console.log(`Creating admin with username: ${adminData.username}`)

    const hashedPassword = await hashPassword(adminData.password)

    const adminUser = {
      id: adminData.username,
      username: adminData.username,
      email: adminData.email,
      role: adminData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: hashedPassword,
    }

    await setDoc(doc(db, "admin_users", adminData.username), adminUser)

    console.log("✅ Super admin user created successfully!")
    console.log(`Username: ${adminData.username}`)
    console.log(`Password: ${adminData.password}`)
    console.log("🔒 Please change the password immediately after first login!")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
  }
}

// Run the script
createFirstAdmin()
