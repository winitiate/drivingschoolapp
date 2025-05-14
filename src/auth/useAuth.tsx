// src/auth/useAuth.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  roles: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, roles: string[]) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    console.warn('✅ useAuth: registering onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.warn('🌀 useAuth: onAuthStateChanged →', fbUser);
      setLoading(true);

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const uid = fbUser.uid;
      const ref = doc(db, 'users', uid);
      console.warn('🔍 useAuth: fetching profile for', uid);

      let snap;
      try {
        // Try a one-off GET (avoids streaming Listen channel entirely)
        snap = await getDocFromServer(ref);
        console.warn('📄 useAuth: got server snapshot', snap.exists(), snap.data());
      } catch (err) {
        console.warn('⚠️ useAuth: getDocFromServer failed, falling back to getDoc', err);
        snap = await getDoc(ref);
        console.warn('📄 useAuth: got fallback snapshot', snap.exists(), snap.data());
      }

      if (!snap.exists()) {
        console.warn('⚠️ useAuth: no profile, signing out');
        await firebaseSignOut(auth);
        setUser(null);
      } else {
        const data = snap.data() as any;
        setUser({
          uid,
          email: fbUser.email,
          roles: Array.isArray(data.roles) ? data.roles : [],
          firstName: data.firstName,
          lastName:  data.lastName,
          phone:     data.phone,
        });
      }

      setLoading(false);
    });

    console.warn('✅ useAuth: listener set up');
    return unsubscribe;
  }, []);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => {});

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const uid = fbUser.uid;
    const ref = doc(db, 'users', uid);

    // Upsert the user record
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email:     fbUser.email,
        roles:     ['student'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, { updatedAt: serverTimestamp() });
    }
  };

  const signUp = async (email: string, password: string, roles: string[]) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid:       cred.user.uid,
      email,
      roles,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const signOutUser = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signInWithGoogle, signUp, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}