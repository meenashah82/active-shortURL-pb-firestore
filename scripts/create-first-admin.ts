// This script creates the first super admin user
// First run: npm install
// Then run: npm run create-admin

import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { createHash } from "crypto"
import * as dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

console.log("🚀 Starting admin user creation script...")
console.log("📁 Loading environment variables from .env.local")

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
  console.log("Example .env.local content:")
  console.log("NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here")
  console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com")
  console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id")
  console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com")
  console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789")
  console.log("NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef")
  process.exit(1)
}

console.log("✅ All environment variables are set")
console.log(`📡 Project ID: ${firebaseConfig.projectId}`)

// Initialize Firebase
let app, db

try {
  console.log("🔥 Initializing Firebase...")
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  console.log("✅ Firebase initialized successfully")
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error)
  process.exit(1)
}

// Simple password hashing function (same as in admin-auth.ts)
function hashPassword(password: string): string {
  return createHash("sha256")
    .update(password + "salt_shorturl_2024")
    .digest("hex")
}

async function createFirstAdmin() {
  try {
    const username = "superadmin"
    const email = "admin@example.com"
    const password = "changeme123"

    console.log("\n🔍 Checking if super admin already exists...")

    // Check if user already exists
    const userRef = doc(db, "admins", username)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      console.log("⚠️  Super admin user already exists!")
      console.log("📋 Existing user details:")
      const data = userDoc.data()
      console.log(`   Username: ${data.username}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   Role: ${data.role}`)
      console.log(`   Active: ${data.isActive ? "Yes" : "No"}`)
      console.log(
        `   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "Unknown"}`,
      )
      console.log("\n🔐 Use these credentials to login:")
      console.log(`   Username: ${username}`)
      console.log(`   Password: ${password} (if not changed)`)
      console.log("\n🌐 Login at: /admin")
      return
    }

    console.log("🔨 Creating super admin user...")

    const hashedPassword = hashPassword(password)

    const adminUser = {
      username: username,
      email: email,
      password: hashedPassword,
      role: "superadmin",
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

    await setDoc(userRef, adminUser)

    console.log("✅ Super admin user created successfully!")
    console.log("=".repeat(60))
    console.log("📋 Admin User Details:")
    console.log(`   Username: ${username}`)
    console.log(`   Email: ${email}`)
    console.log(`   Role: superadmin`)
    console.log(`   Status: Active`)
    console.log(`   Permissions: Full access`)
    console.log("\n🔐 Login Credentials:")
    console.log(`   Username: ${username}`)
    console.log(`   Password: ${password}`)
    console.log("\n🌐 You can now login at:")
    console.log(`   Local: http://localhost:3000/admin`)
    console.log(`   Production: https://www.wodify.link/admin`)
    console.log("\n⚠️  IMPORTANT: Change the password immediately after first login!")
    console.log("=".repeat(60))
  } catch (error: any) {
    console.error("❌ Error creating super admin user:", error)

    if (error.code === "permission-denied") {
      console.log("\n💡 This might be a Firestore security rules issue.")
      console.log("   Make sure your Firestore rules allow write access to the 'admins' collection.")
      console.log("   Example rule for testing:")
      console.log("   rules_version = '2';")
      console.log("   service cloud.firestore {")
      console.log("     match /databases/{database}/documents {")
      console.log("       match /{document=**} {")
      console.log("         allow read, write: if true;")
      console.log("       }")
      console.log("     }")
      console.log("   }")
    } else if (error.code === "unavailable") {
      console.log("\n💡 Check your Firebase configuration and internet connection.")
    } else if (error.code === "invalid-api-key") {
      console.log("\n💡 Your Firebase API key is invalid. Check your .env.local file.")
    } else if (error.code === "project-not-found") {
      console.log("\n💡 Firebase project not found. Check your project ID in .env.local.")
    }

    process.exit(1)
  }
}

// Run the script
createFirstAdmin()
  .then(() => {
    console.log("\n🎉 Script completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error)
    process.exit(1)
  })
