import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Robustly handle environment variables to prevent crashes if import.meta is not fully defined
const getEnvVar = (key: string) => {
  try {
    return (import.meta as any).env?.[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
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
    console.warn("⚠️ Firebase credentials missing. App running in Offline/Mock mode.");
}

export { db };