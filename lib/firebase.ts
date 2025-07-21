import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("Missing Firebase environment variables:", missingEnvVars)
  // Don't throw error, just log it to prevent app crash
}

// Initialize Firebase with error handling
let app = null
let db = null

try {
  // Only initialize if all env vars are present
  if (missingEnvVars.length === 0) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    db = getFirestore(app)
    console.log("Firebase initialized successfully")
  } else {
    console.warn("Firebase not initialized due to missing environment variables")
  }
} catch (error) {
  console.error("Firebase initialization error:", error)
  // Keep app and db as null to prevent crashes
}

export { db }
export default app
