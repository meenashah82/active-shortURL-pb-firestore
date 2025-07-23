import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

let app: FirebaseApp | null = null
let db: Firestore | null = null

// Initialize Firebase for both client and server
function initializeFirebase() {
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
      throw new Error(`Missing Firebase environment variables: ${missingVars.join(", ")}`)
    }

    // Initialize Firebase app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log("Firebase app initialized with project:", firebaseConfig.projectId)
    } else {
      app = getApps()[0]
    }

    // Initialize Firestore
    db = getFirestore(app)
    console.log("Firestore initialized successfully")

    return { app, db }
  } catch (error: any) {
    console.error("Firebase initialization error:", error)
    throw error
  }
}

// Get both Firebase app and Firestore db (works on both client and server)
export function getFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  try {
    return initializeFirebase()
  } catch (error) {
    console.error("Failed to get Firebase:", error)
    return { app: null, db: null }
  }
}

// Get just the Firebase app instance
export function getFirebaseApp(): FirebaseApp | null {
  const { app } = getFirebase()
  return app
}

// Initialize and export db
const { db: firestoreDb } = initializeFirebase()
export { firestoreDb as db }
