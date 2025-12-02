import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const env = (import.meta as any).env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
let app;
let db: any = null;

// Check if critical keys are present to avoid errors during empty init
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            console.log("✅ Firebase SDK Initialized for Project:", firebaseConfig.projectId);
        } else {
            app = getApp();
            console.log("✅ Firebase SDK retrieved from existing instance.");
        }
        db = getFirestore(app);
    } catch (error) {
        console.error("❌ Firebase Initialization Error:", error);
    }
} else {
    console.warn("⚠️ Firebase credentials missing in .env. App running in Local/Offline mode.");
}

export { db };