// src/firebase.ts
import { initializeApp }       from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth }             from 'firebase/auth';

// In Vite, only VITE_-prefixed env vars are exposed via import.meta.env
const env = import.meta.env as Record<string,string>;

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY!,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId:         env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             env.VITE_FIREBASE_APP_ID!,
};

console.log('🔥 Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig);

// Use only fetch-based RPCs; disable any streaming/listen channels
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: false,
  useFetchStreams:             true,
});

export const auth = getAuth(app);
