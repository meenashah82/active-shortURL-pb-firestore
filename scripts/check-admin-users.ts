// This script checks if admin users exist in the database
// First run: npm install
// Then run: npx tsx scripts/check-admin-users.ts

import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

// Firebase configuration - make sure these environment variables are set
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

async function checkAdminUsers() {
  try {
    console.log("\n🔍 Checking for admin users in the database...")

    const adminsSnapshot = await getDocs(collection(db, "admins"))

    if (adminsSnapshot.empty) {
      console.log("❌ No admin users found in the database.")
      console.log("\n💡 To create the first super admin user:")
      console.log("   npx tsx scripts/create-first-admin.ts")
      return
    }

    console.log(`✅ Found ${adminsSnapshot.size} admin user(s):`)
    console.log("=".repeat(60))

    adminsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      console.log(`📋 Username: ${data.username || doc.id}`)
      console.log(`   Email: ${data.email || "Not set"}`)
      console.log(`   Role: ${data.role || "Unknown"}`)
      console.log(`   Active: ${data.isActive ? "Yes" : "No"}`)
      console.log(
        `   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "Unknown"}`,
      )
      if (data.lastLogin) {
        console.log(`   Last Login: ${new Date(data.lastLogin.seconds * 1000).toLocaleString()}`)
      } else {
        console.log(`   Last Login: Never`)
      }
      console.log("-".repeat(40))
    })

    console.log("\n🎯 You can now login at your-domain.com/admin with these credentials.")
    console.log("🔐 Default credentials (if using the setup script):")
    console.log("   Username: superadmin")
    console.log("   Password: changeme123")
    console.log("\n⚠️  Remember to change the default password after first login!")
  } catch (error) {
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
