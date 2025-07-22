import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

let app: FirebaseApp | null = null
let db: Firestore | null = null

export function getFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  if (typeof window === "undefined") {
    return { app: null, db: null }
  }

  if (app && db) {
    return { app, db }
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

    // Check for missing environment variables
    const missingVars = Object.entries(firebaseConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error("Missing Firebase environment variables:", missingVars)
      return { app: null, db: null }
    }

    // Initialize Firebase app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log("Firebase app initialized with project:", firebaseConfig.projectId)
    } else {
      app = getApps()[0]
    }

    // Initialize Firestore with error handling
    try {
      db = getFirestore(app)
      console.log("Firestore initialized successfully")
    } catch (firestoreError: any) {
      console.error("Firestore initialization failed:", firestoreError)

      // Check for specific error messages
      if (firestoreError.message?.includes("service not available")) {
        console.error("Firestore service is not available. Please:")
        console.error("1. Go to Firebase Console")
        console.error("2. Navigate to Build > Firestore Database")
        console.error("3. Click 'Create database' if not already created")
        console.error("4. Choose 'Start in test mode' for now")
      }

      db = null
    }

    return { app, db }
  } catch (error: any) {
    console.error("Firebase initialization error:", error)
    app = null
    db = null
    return { app: null, db: null }
  }
}

// Export db for backward compatibility
export { db }
