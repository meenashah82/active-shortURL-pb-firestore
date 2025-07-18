// This script creates the first super admin user
// First run: npm install
// Then run: npx tsx scripts/create-first-admin.ts

import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { createHash } from "crypto"

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

// Hash password function
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

async function createFirstAdmin() {
  try {
    const adminId = "superadmin"
    const adminRef = doc(db, "admins", adminId)

    // Check if admin already exists
    const adminDoc = await getDoc(adminRef)
    if (adminDoc.exists()) {
      console.log("⚠️  Super admin user already exists!")
      console.log("📋 Existing admin details:")
      const data = adminDoc.data()
      console.log(`   Username: ${data.username}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   Role: ${data.role}`)
      console.log(`   Active: ${data.isActive ? "Yes" : "No"}`)
      console.log("\n🎯 You can login at /admin with:")
      console.log("   Username: superadmin")
      console.log("   Password: changeme123 (if not changed)")
      return
    }

    // Create the super admin user
    const adminData = {
      username: "superadmin",
      email: "admin@example.com",
      passwordHash: hashPassword("changeme123"),
      role: "super_admin",
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
      permissions: {
        canManageUsers: true,
        canManageUrls: true,
        canViewAnalytics: true,
        canManageSettings: true,
      },
    }

    await setDoc(adminRef, adminData)

    console.log("✅ Super admin user created successfully!")
    console.log("=".repeat(50))
    console.log("📋 Admin Details:")
    console.log(`   Username: ${adminData.username}`)
    console.log(`   Email: ${adminData.email}`)
    console.log(`   Role: ${adminData.role}`)
    console.log(`   Password: changeme123`)
    console.log("=".repeat(50))
    console.log("\n🎯 You can now login at /admin with the credentials above.")
    console.log("⚠️  IMPORTANT: Change the default password after first login!")
  } catch (error) {
    console.error("❌ Error creating super admin user:", error)

    if (error.code === "permission-denied") {
      console.log("\n💡 This might be a Firestore security rules issue.")
      console.log("   Make sure your Firestore rules allow write access to the 'admins' collection.")
    } else if (error.code === "unavailable") {
      console.log("\n💡 Check your Firebase configuration and internet connection.")
    }

    process.exit(1)
  }
}

// Run the script
createFirstAdmin()
