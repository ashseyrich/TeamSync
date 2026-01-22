import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

let db: any = null;
let auth: any = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined") {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        // Use initializeFirestore instead of getFirestore to enable ignoreUndefinedProperties
        // This prevents crashes when saving objects with optional undefined fields (like GPS coords)
        db = initializeFirestore(app, {
            ignoreUndefinedProperties: true
        });
        auth = getAuth(app);
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
} else {
    console.info("Firebase configuration missing. Running in local-only mode.");
}

export { db, auth };