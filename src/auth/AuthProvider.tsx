// src/auth/AuthProvider.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => {});

  const signUp = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password).then(() => {});

  const signOutUser = () => auth.signOut();

  return (
    <AuthContext.Provider
      value={{ user, signIn, signUp, signOut: signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
