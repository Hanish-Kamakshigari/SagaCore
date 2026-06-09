import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.GCP_CLIENT_EMAIL,
        privateKey: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    })
    console.log('[Firebase Admin] Initialized SDK successfully.')
  } catch (error: any) {
    console.error('[Firebase Admin Error] Failed to initialize Firebase Admin SDK:', error.message || error)
  }
}

export const adminAuth = getAuth()
