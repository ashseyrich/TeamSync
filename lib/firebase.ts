import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyBkuPBle8OXEioCyxMZBsLrL_l6YoIUPTU",
  authDomain: "teamsyncgit-82848824-7f126.firebaseapp.com",
  projectId: "teamsyncgit-82848824-7f126",
  storageBucket: "teamsyncgit-82848824-7f126.firebasestorage.app",
  messagingSenderId: "729691789322",
  appId: "1:729691789322:web:7f26e4d663df6bff7367f3"
};

let app;
let db: any = null;

/**
 * --- FIREBASE SAFE MODE ---
 * Firebase is currently disabled to allow for local debugging and stable Netlify initial deploys.
 * To enable, uncomment the block below.
 */

/*
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
*/

export { db };