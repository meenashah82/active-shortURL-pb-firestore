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

let app: FirebaseApp | null = null
let db: Firestore | null = null

// This function ensures that we only initialize the app once on the client-side.
function initializeFirebaseClient() {
  if (typeof window !== "undefined") {
    try {
      if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        if (getApps().length === 0) {
          app = initializeApp(firebaseConfig)
        } else {
          app = getApp()
        }
        db = getFirestore(app)
        console.log("Firebase client initialized successfully.")
      } else {
        console.error("Firebase config missing. App will not work correctly.")
      }
    } catch (error) {
      console.error("Firebase client initialization error:", error)
      app = null
      db = null
    }
  }
}

// Initialize the app when this module is loaded.
initializeFirebaseClient()

export { db, app }
