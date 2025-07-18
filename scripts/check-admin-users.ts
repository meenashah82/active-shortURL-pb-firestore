// This script checks existing admin users
// Run with: npm run check-admin

import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import * as dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

console.log("🔍 Starting admin user check script...")
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

async function checkAdminUsers() {
  try {
    console.log("\n🔍 Checking admin users in Firestore...")

    const adminsRef = collection(db, "admins")
    const snapshot = await getDocs(adminsRef)

    if (snapshot.empty) {
      console.log("❌ No admin users found in the database!")
      console.log("\n💡 To create the first admin user, run:")
      console.log("   npm run create-admin")
      return
    }

    console.log(`✅ Found ${snapshot.size} admin user(s):`)
    console.log("=".repeat(60))

    snapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`📋 User ID: ${doc.id}`)
      console.log(`   Username: ${data.username || "Not set"}`)
      console.log(`   Email: ${data.email || "Not set"}`)
      console.log(`   Role: ${data.role || "Unknown"}`)
      console.log(`   Active: ${data.isActive ? "Yes" : "No"}`)
      console.log(
        `   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "Unknown"}`,
      )
      console.log(
        `   Last Login: ${data.lastLogin ? new Date(data.lastLogin.seconds * 1000).toLocaleString() : "Never"}`,
      )

      if (data.permissions) {
        console.log(`   Permissions:`)
        console.log(`     - Manage Users: ${data.permissions.canManageUsers ? "Yes" : "No"}`)
        console.log(`     - Manage URLs: ${data.permissions.canManageUrls ? "Yes" : "No"}`)
        console.log(`     - View Analytics: ${data.permissions.canViewAnalytics ? "Yes" : "No"}`)
        console.log(`     - Manage Settings: ${data.permissions.canManageSettings ? "Yes" : "No"}`)
      }

      console.log("-".repeat(40))
    })

    console.log("=".repeat(60))
    console.log("\n🌐 You can login at:")
    console.log("   Local: http://localhost:3000/admin")
    console.log("   Production: https://www.wodify.link/admin")

    // Check for default admin
    const hasDefaultAdmin = snapshot.docs.some((doc) => doc.id === "superadmin")
    if (hasDefaultAdmin) {
      console.log("\n🔐 Default admin credentials (if not changed):")
      console.log("   Username: superadmin")
      console.log("   Password: changeme123")
      console.log("   ⚠️  Change the password after first login!")
    }
  } catch (error: any) {
    console.error("❌ Error checking admin users:", error)

    if (error.code === "permission-denied") {
      console.log("\n💡 This might be a Firestore security rules issue.")
      console.log("   Make sure your Firestore rules allow read access to the 'admins' collection.")
    } else if (error.code === "unavailable") {
      console.log("\n💡 Check your Firebase configuration and internet connection.")
    }

    process.exit(1)
  }
}

// Run the script
checkAdminUsers()
  .then(() => {
    console.log("\n🎉 Check completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Check failed:", error)
    process.exit(1)
  })
