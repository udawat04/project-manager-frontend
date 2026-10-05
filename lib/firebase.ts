import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'default';

// Debug: log full config to verify env is loaded correctly
if (typeof window !== 'undefined') {
  console.log('[Firebase] Config:', JSON.stringify({
    projectId: firebaseConfig.projectId,
    databaseId,
    apiKey: firebaseConfig.apiKey ? '✓ set' : '✗ MISSING',
    authDomain: firebaseConfig.authDomain ? '✓ set' : '✗ MISSING',
    appId: firebaseConfig.appId ? '✓ set' : '✗ MISSING',
  }));
}

let app: any;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (err) {
  console.error('[Firebase] Failed to initialize app:', err);
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

let db: ReturnType<typeof getFirestore>;
try {
  db = getFirestore(app, databaseId);
} catch (err) {
  console.error('[Firebase] Failed to get Firestore:', err);
  db = getFirestore(app, databaseId);
}

export { app, db };

