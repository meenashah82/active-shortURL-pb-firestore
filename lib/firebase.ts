import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

let app: FirebaseApp | null = null
let firebaseDB: Firestore | null = null

export function getFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  if (typeof window === "undefined") {
    // Server-side: return null to prevent server-side initialization
    return { app: null, db: null }
  }

  if (app && firebaseDB) {
    // Already initialized
    return { app, db: firebaseDB }
  }

  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Check if all required config values are present
    const missingVars = Object.entries(firebaseConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error("Missing Firebase environment variables:", missingVars)
      console.error("Please set these environment variables in your Vercel project:")
      missingVars.forEach((varName) => {
        console.error(`- ${varName.replace("process.env.", "")}`)
      })
      return { app: null, db: null }
    }

    // Initialize Firebase if not already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log("Firebase app initialized successfully")
    } else {
      app = getApps()[0]
      console.log("Using existing Firebase app")
    }

    // Initialize Firestore
    try {
      firebaseDB = getFirestore(app)
      console.log("Firestore initialized successfully")
    } catch (firestoreError: any) {
      console.error("Failed to initialize Firestore:", firestoreError.message)
      if (firestoreError.message.includes("service not available")) {
        console.error("This usually means Firestore is not enabled in your Firebase project.")
        console.error("Go to Firebase Console → Build → Firestore Database → Create database")
      }
      return { app, db: null }
    }

    return { app, db: firebaseDB }
  } catch (error: any) {
    console.error("Firebase initialization error:", error.message)
    return { app: null, db: null }
  }
}
