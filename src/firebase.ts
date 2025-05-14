// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';
import { getAuth }       from 'firebase/auth';

// In browser (Vite), use import.meta.env; in Node, use process.env
const env = typeof window !== 'undefined' && import.meta?.env
  ? import.meta.env
  : process.env as Record<string, string>;

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY!,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId:         env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             env.VITE_FIREBASE_APP_ID!,
};

// Ensure we only initialize once
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
