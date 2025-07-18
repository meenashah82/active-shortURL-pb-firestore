// This script creates the first super admin user
// Run locally with: npx tsx scripts/create-first-admin.ts

import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
]

console.log("🔧 Checking environment variables...")
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.log("❌ Missing environment variables:")
  missingVars.forEach((varName) => {
    console.log(`   - ${varName}`)
  })
  console.log("\n💡 Create a .env.local file with your Firebase configuration")
  process.exit(1)
}

console.log("✅ All environment variables are set")

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Simple password hashing function
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_shorturl_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function createFirstAdmin() {
  try {
    const username = "superadmin"
    const email = "admin@example.com"
    const password = "changeme123"

    console.log("\n🔍 Checking if super admin already exists...")

    // Check if user already exists
    const userDoc = await getDoc(doc(db, "admins", username))
    if (userDoc.exists()) {
      console.log("⚠️  Super admin user already exists!")
      console.log("📋 Existing user details:")
      const data = userDoc.data()
      console.log(`   Username: ${data.username}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   Role: ${data.role}`)
      console.log(`   Active: ${data.isActive ? "Yes" : "No"}`)
      console.log("\n🔐 Use these credentials to login:")
      console.log(`   Username: ${username}`)
      console.log(`   Password: ${password}`)
      return
    }

    console.log("🔨 Creating super admin user...")

    const hashedPassword = await hashPassword(password)

    const adminUser = {
      username: username,
      email: email,
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
      createdAt: new Date(),
    }

    await setDoc(doc(db, "admins", username), adminUser)

    console.log("✅ Super admin user created successfully!")
    console.log("=".repeat(50))
    console.log("📋 Admin User Details:")
    console.log(`   Username: ${username}`)
    console.log(`   Email: ${email}`)
    console.log(`   Role: superadmin`)
    console.log(`   Status: Active`)
    console.log("\n🔐 Login Credentials:")
    console.log(`   Username: ${username}`)
    console.log(`   Password: ${password}`)
    console.log("\n🌐 You can now login at your-domain.com/admin")
    console.log("⚠️  IMPORTANT: Change the password immediately after first login!")
  } catch (error) {
    console.error("❌ Error creating super admin user:", error)

    if (error.code === "permission-denied") {
      console.log("\n💡 This might be a Firestore security rules issue.")
      console.log("   Make sure your Firestore rules allow write access to the 'admins' collection.")
    }

    process.exit(1)
  }
}

// Run the script
createFirstAdmin()
