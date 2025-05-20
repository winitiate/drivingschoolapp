// src/firebase.ts
import { initializeApp }       from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth }            from 'firebase/auth';

const env = import.meta.env as Record<string,string>;
const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY!,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId:         env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             env.VITE_FIREBASE_APP_ID!,
};

console.warn('🔥 firebaseConfig:', firebaseConfig);

// Initialize app
const app = initializeApp(firebaseConfig);

// **Force XHR long-polling and disable fetch-streams** so no Listen channel is ever opened
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams:             false,
});

export const auth = getAuth(app);

