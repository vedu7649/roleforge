import { initializeApp } from "firebase/app";
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate critical config
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
  console.error("⚠️ FIREBASE CONFIGURATION MISSING: Please ensure all VITE_FIREBASE_... environment variables are set in your deployment settings.");
}

// Initialize Firebase with safety
const app = isConfigValid ? initializeApp(firebaseConfig) : null;

export const db = isConfigValid ? initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
}) : null;

export const auth = isConfigValid ? getAuth(app) : { 
  currentUser: null, 
  onAuthStateChanged: (cb) => { 
    console.warn("Auth not initialized due to missing config.");
    return () => {}; 
  } 
};

export const googleProvider = new GoogleAuthProvider();
if (isConfigValid) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}