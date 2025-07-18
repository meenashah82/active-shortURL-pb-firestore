// This script checks if admin users exist in the database
// Run with: npx tsx scripts/check-admin-users.ts

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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkAdminUsers() {
  try {
    console.log("🔍 Checking for admin users in the database...")

    const adminsSnapshot = await getDocs(collection(db, "admins"))

    if (adminsSnapshot.empty) {
      console.log("❌ No admin users found in the database.")
      console.log("💡 Run the create-first-admin script to create the first super admin.")
      return
    }

    console.log(`✅ Found ${adminsSnapshot.size} admin user(s):`)
    console.log("=".repeat(50))

    adminsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      console.log(`Username: ${data.username}`)
      console.log(`Email: ${data.email}`)
      console.log(`Role: ${data.role}`)
      console.log(`Active: ${data.isActive ? "Yes" : "No"}`)
      console.log(`Created: ${new Date(data.createdAt).toLocaleString()}`)
      if (data.lastLogin) {
        console.log(`Last Login: ${new Date(data.lastLogin).toLocaleString()}`)
      } else {
        console.log(`Last Login: Never`)
      }
      console.log("-".repeat(30))
    })

    console.log("🎯 You can now login at /admin with these credentials.")
  } catch (error) {
    console.error("❌ Error checking admin users:", error)
    process.exit(1)
  }
}

// Run the script
checkAdminUsers()
