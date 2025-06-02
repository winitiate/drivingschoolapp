// src/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore }            from "firebase/firestore";
import { getAuth }                        from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const env = import.meta.env as Record<string, string>;

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY!,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId:         env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             env.VITE_FIREBASE_APP_ID!,
};

console.warn("🔥 firebaseConfig:", firebaseConfig);

// 1️⃣ Initialize (or reuse) the Firebase App
function createFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

const app = createFirebaseApp();

// 2️⃣ Initialize Firestore with your specific settings
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams:             false,
});

// 3️⃣ Initialize Auth (if you need it)
export const auth = getAuth(app);

// 4️⃣ Initialize Functions and—if on localhost—wire up the emulator
export const functions = getFunctions(app);
if (window.location.hostname === "localhost") {
  // Make sure your Functions emulator is running on port 5001
  connectFunctionsEmulator(functions, "localhost", 5001);
}
