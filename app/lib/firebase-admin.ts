import { initializeApp, getApps, cert } from 'firebase-admin/app'

if (!getApps().length) {
  try {
    let privateKey = process.env.GCP_PRIVATE_KEY ? process.env.GCP_PRIVATE_KEY.trim() : ''
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1)
    }
    privateKey = privateKey.trim()

    const clientEmail = process.env.GCP_CLIENT_EMAIL ? process.env.GCP_CLIENT_EMAIL.trim() : ''
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim() : ''

    if (privateKey && clientEmail && projectId) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
      console.log('[Firebase Admin] Initialized SDK successfully.')
    } else {
      console.warn('[Firebase Admin Warning] GCP credentials missing or incomplete in environment. Bypassing Admin SDK initialization.')
    }
  } catch (error: any) {
    console.error('[Firebase Admin Error] Failed to initialize Firebase Admin SDK:', error.message || error)
  }
}
