// This script creates the first super admin user
// Run with: npm run create-admin

import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"

// Firebase configuration - make sure these environment variables are set
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

// Simple password hashing function (same as in admin-auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_shorturl_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function createFirstAdmin() {
  try {
    // CHANGE THESE CREDENTIALS BEFORE RUNNING!
    const adminData = {
      username: "superadmin",
      email: "admin@yourcompany.com",
      password: "changeme123", // CHANGE THIS!
      role: "superadmin" as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    console.log("Creating first super admin user...")
    console.log("Username:", adminData.username)
    console.log("Email:", adminData.email)
    console.log("⚠️  IMPORTANT: Change the default password after first login!")

    const hashedPassword = await hashPassword(adminData.password)

    const adminUser = {
      ...adminData,
      password: hashedPassword,
    }

    await setDoc(doc(db, "admins", adminData.username), adminUser)

    console.log("✅ Super admin user created successfully!")
    console.log("You can now login at /admin with the credentials above.")
    console.log("🔒 Remember to change the password immediately after first login!")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
    process.exit(1)
  }
}

// Run the script
createFirstAdmin()
