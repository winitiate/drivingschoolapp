// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface AuthContextValue {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email:string, pass:string) => Promise<void>;
  signUp: (email:string, pass:string, role:string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  const db   = getFirestore();
  const [user, setUser]     = useState<User|null>(null);
  const [role, setRole]     = useState<string|null>(null);
  const [loading, setLoad]  = useState(true);

  // Listen for sign-in/out
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        // Option A: read custom claim directly
        const token = await u.getIdTokenResult();
        setRole(token.claims.role as string || null);

        // Option B: fetch a profile doc that stores role
        // const snap = await getDoc(doc(db, 'profiles', u.uid));
        // setRole(snap.data()?.role || null);
      } else {
        setRole(null);
      }
      setLoad(false);
    });
    return unsub;
  }, [auth, db]);

  // Sign-in and sign-up helpers
  const signIn = (email:string, pass:string) =>
    signInWithEmailAndPassword(auth, email, pass).then(() => {});

  const signUp = async (email:string, pass:string, newRole:string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    // If you want to store role in Firestore for later use:
    await db.collection('profiles').doc(credential.user.uid).set({ role: newRole });
    // To set a custom claim you need a backend Admin SDK call
  };

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
}
