// src/firebase.ts

/**
 * firebase.ts
 *
 * Production‐only Firebase initialization.
 * 
 * - Reuses an existing App if already initialized (prevents duplicate apps).
 * - Sets up Firestore with your custom settings.
 * - Exports Auth so your hooks (useAuth.ts, etc.) can consume it.
 * - Exports Functions without any emulator wiring.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore }            from "firebase/firestore";
import { getAuth }                        from "firebase/auth";
import { getFunctions }                   from "firebase/functions";

const env = import.meta.env as Record<string, string>;

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY!,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId:         env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             env.VITE_FIREBASE_APP_ID!,
};

/**
 * Create or reuse the Firebase App instance.
 */
function createFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

const app = createFirebaseApp();

/**
 * Firestore database instance.
 * Keeps your previous settings for long‐polling and streams.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams:             false,
});

/**
 * Firebase Auth instance.
 * Exported so that your useAuth.ts (and any other auth logic) can import { auth } from "./firebase".
 */
export const auth = getAuth(app);

/**
 * Cloud Functions instance (production).
 * No emulator wiring—always talks to your deployed functions.
 */
export const functions = getFunctions(app);
