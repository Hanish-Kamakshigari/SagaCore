import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if variables exist; if not, we flag it so we can fall back to mock auth
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
)

let app
let auth: any

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
    console.log('🔥 Firebase Initialized Successfully!')
  } catch (error) {
    console.error('🔥 Firebase initialization error, falling back to mock mode:', error)
  }
} else {
  console.warn(
    '⚠️ Firebase environment variables are missing! SAGACORE is running in Mock Auth Mode.\n' +
    'Please configure your NEXT_PUBLIC_FIREBASE_* keys in your .env file to use real authentication.'
  )
}

export { app, auth, isFirebaseConfigured }
