import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Handle edge cases where import.meta or import.meta.env might be undefined
const meta = import.meta as any;
const env = (meta && meta.env) ? meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let app;
let db: any = null;

// Initialize Firebase only if critical config is present
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            console.log("✅ Firebase SDK Initialized");
        } else {
            app = getApp();
        }
        db = getFirestore(app);
    } catch (error) {
        console.error("❌ Firebase Initialization Error:", error);
    }
} else {
    console.warn("⚠️ Firebase credentials missing. Running in offline mode.");
}

export { db };