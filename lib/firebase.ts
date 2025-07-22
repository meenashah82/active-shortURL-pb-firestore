import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let db: Firestore | null = null

// This function initializes Firebase and should only be called on the client-side.
function initializeFirebase() {
  if (typeof window !== "undefined") {
    if (!firebaseConfig.apiKey) {
      console.error("Firebase Error: Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY")
      return
    }
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig)
        db = getFirestore(app)
        console.log("Firebase initialized successfully.")
      } catch (error) {
        console.error("Firebase initialization error:", error)
      }
    } else {
      app = getApp()
      db = getFirestore(app)
    }
  }
}

// Initialize Firebase on load
initializeFirebase()

export { db }
