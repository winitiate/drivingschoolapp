// src/auth/useAuth.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  roles: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Now supports multiple memberships:
  businessIds: string[];
  serviceLocationIds: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    roles: string[],
    businessId?: string
  ) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const uid = fbUser.uid;
      const ref = doc(db, 'users', uid);
      let snap;
      try {
        snap = await getDocFromServer(ref);
      } catch {
        snap = await getDoc(ref);
      }

      if (!snap.exists()) {
        await firebaseSignOut(auth);
        setUser(null);
      } else {
        const data = snap.data() as any;

        // Normalize to arrays (legacy support for single businessId)
        const businessIds: string[] = Array.isArray(data.businessIds)
          ? data.businessIds
          : data.businessId
            ? [data.businessId]
            : [];

        const serviceLocationIds: string[] = Array.isArray(data.serviceLocationIds)
          ? data.serviceLocationIds
          : [];

        setUser({
          uid,
          email: fbUser.email,
          roles: Array.isArray(data.roles) ? data.roles : [],
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          businessIds,
          serviceLocationIds
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => {});

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const uid = fbUser.uid;
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email: fbUser.email,
        roles: ['client'],            // default role
        businessIds: [],
        serviceLocationIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(ref, { updatedAt: serverTimestamp() });
    }
  };

  const signUp = async (
    email: string,
    password: string,
    roles: string[],
    businessId?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
      uid: cred.user.uid,
      email,
      roles,
      businessIds: businessId ? [businessId] : [],
      serviceLocationIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
