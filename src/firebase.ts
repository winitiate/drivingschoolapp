// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore }  from "firebase/firestore";

const apiKey            = process.env.VITE_FIREBASE_API_KEY!;
const authDomain        = process.env.VITE_FIREBASE_AUTH_DOMAIN!;
const projectId         = process.env.VITE_FIREBASE_PROJECT_ID!;
const storageBucket     = process.env.VITE_FIREBASE_STORAGE_BUCKET!;
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!;
const appId             = process.env.VITE_FIREBASE_APP_ID!;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
