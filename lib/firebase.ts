import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app
let db = null

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApp()
  }

  const firestore = getFirestore(app)

  // This check is crucial. If firestore service is not enabled in your Firebase project,
  // getFirestore() might not throw immediately but the service will not be available.
  if (firestore) {
    db = firestore
    console.log("Firebase and Firestore initialized successfully.")
  } else {
    console.error("Firebase initialization error: Firestore service is not available.")
  }

  // Optional: Connect to Firestore emulator in development
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(":")
    connectFirestoreEmulator(db, host, Number.parseInt(port))
    console.log(`Connecting to Firestore emulator at ${host}:${port}`)
  }
} catch (error) {
  console.error("Firebase initialization error:", error)
  // Set db to null so the app can handle the uninitialized state gracefully
  db = null
}

export { db }
