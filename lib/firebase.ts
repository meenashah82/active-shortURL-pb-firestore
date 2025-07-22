import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Global variables to store Firebase instances
let app: FirebaseApp | null = null
let firebaseDb: Firestore | null = null

// Function to get Firebase configuration from environment variables
function getFirebaseConfig(): FirebaseConfig | null {
  // Only run on client side
  if (typeof window === "undefined") {
    return null
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Check if all required environment variables are present
  const missingVars = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`)

  if (missingVars.length > 0) {
    console.error("Missing Firebase environment variables:", missingVars)
    console.error("Please set these variables in your Vercel project settings:")
    missingVars.forEach((varName) => {
      console.error(`- ${varName}`)
    })
    return null
  }

  return config as FirebaseConfig
}

// Function to initialize Firebase
function initializeFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  try {
    // Only initialize on client side
    if (typeof window === "undefined") {
      return { app: null, db: null }
    }

    // Return existing instances if already initialized
    if (app && firebaseDb) {
      return { app, db: firebaseDb }
    }

    // Get Firebase configuration
    const config = getFirebaseConfig()
    if (!config) {
      console.error("Firebase configuration is not available")
      return { app: null, db: null }
    }

    // Initialize Firebase app if not already initialized
    if (getApps().length === 0) {
      app = initializeApp(config)
      console.log("Firebase app initialized successfully")
    } else {
      app = getApps()[0]
      console.log("Using existing Firebase app")
    }

    // Initialize Firestore
    try {
      firebaseDb = getFirestore(app)
      console.log("Firestore initialized successfully")
    } catch (firestoreError) {
      console.error("Failed to initialize Firestore:", firestoreError)
      console.error("Please ensure Firestore is enabled in your Firebase project console")
      return { app, db: null }
    }

    return { app, db: firebaseDb }
  } catch (error) {
    console.error("Firebase initialization error:", error)
    return { app: null, db: null }
  }
}

// Export function to get Firebase instances
export function getFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  return initializeFirebase()
}

// Export db for backward compatibility
const firebaseInstance = getFirebase()
export const db = firebaseInstance.db
