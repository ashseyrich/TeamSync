import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Environment variables are automatically injected by Vite/Netlify
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

let db: any = null;

// Only initialize if we have at least an API key, otherwise fallback to local storage mode
if (firebaseConfig.apiKey) {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
} else {
    console.info("Firebase config missing. Running in Local Storage mode.");
}

export { db };