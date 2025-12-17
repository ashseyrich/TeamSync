import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkuPBle8OXEioCyxMZBsLrL_l6YoIUPTU",
  authDomain: "teamsyncgit-82848824-7f126.firebaseapp.com",
  projectId: "teamsyncgit-82848824-7f126",
  storageBucket: "teamsyncgit-82848824-7f126.firebasestorage.app",
  messagingSenderId: "729691789322",
  appId: "1:729691789322:web:7f26e4d663df6bff7367f3"
};

let db: any = null;

// FIREBASE SAFE MODE - Set to false if using a live Firestore instance
const USE_FIREBASE = false; 

if (USE_FIREBASE) {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        console.log("🔥 Firebase Live Active");
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
}

export { db };