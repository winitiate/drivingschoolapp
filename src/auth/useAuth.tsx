// src/auth/useAuth.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import {
  doc,
  onSnapshot,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
  DocumentSnapshot
} from 'firebase/firestore'
import { auth, db } from '../firebase'

export interface AuthUser {
  uid: string
  email: string | null
  roles: string[]
  firstName?: string
  lastName?: string
  phone?: string

  ownedBusinessIds: string[]
  memberBusinessIds: string[]
  ownedLocationIds: string[]
  adminLocationIds: string[]
  providerLocationIds: string[]
  clientLocationIds: string[]
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn(email: string, password: string): Promise<AuthUser>
  signInWithGoogle(): Promise<AuthUser>
  signUp(email: string, password: string, roles: string[]): Promise<AuthUser>
  signOutUser(): Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const googleProvider = new GoogleAuthProvider()

  // Normalize a Firestore user snapshot into AuthUser
  function normalizeSnapshot(
    fbUser: FirebaseUser,
    snap: DocumentSnapshot
  ): AuthUser {
    const data = snap.data() as any
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      roles: Array.isArray(data.roles) ? data.roles : [],
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      ownedBusinessIds: Array.isArray(data.ownedBusinessIds) ? data.ownedBusinessIds : [],
      memberBusinessIds: Array.isArray(data.memberBusinessIds) ? data.memberBusinessIds : [],
      ownedLocationIds: Array.isArray(data.ownedLocationIds) ? data.ownedLocationIds : [],
      adminLocationIds: Array.isArray(data.adminLocationIds) ? data.adminLocationIds : [],
      providerLocationIds: Array.isArray(data.providerLocationIds) ? data.providerLocationIds : [],
      clientLocationIds: Array.isArray(data.clientLocationIds) ? data.clientLocationIds : []
    }
  }

  useEffect(() => {
    let unsubProfile: (() => void) | null = null

    // Listen to Firebase Auth state
    const unsubAuth = onAuthStateChanged(auth, fbUser => {
      setLoading(true)

      // cleanup previous profile listener
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }

      if (fbUser) {
        const userRef = doc(db, 'users', fbUser.uid)
        // Subscribe in real‐time to the user doc
        unsubProfile = onSnapshot(
          userRef,
          snap => {
            if (snap.exists()) {
              const profile = normalizeSnapshot(fbUser, snap)
              setUser(profile)
            } else {
              // profile missing → sign out
              firebaseSignOut(auth)
              setUser(null)
            }
            setLoading(false)
          },
          err => {
            // onSnapshot error → fallback to one‐time fetch
            getDoc(userRef)
              .then(snap => {
                if (snap.exists()) {
                  setUser(normalizeSnapshot(fbUser, snap))
                } else {
                  firebaseSignOut(auth)
                  setUser(null)
                }
              })
              .catch(() => {
                firebaseSignOut(auth)
                setUser(null)
              })
              .finally(() => setLoading(false))
          }
        )
      } else {
        // signed out
        setUser(null)
        setLoading(false)
      }
    })

    // cleanup on unmount
    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  // Email/password sign in
  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged + onSnapshot will update user for us
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (!loading && user) {
          clearInterval(check)
          resolve(user)
        }
      }, 50)
    })
  }

  // Google popup sign in
  const signInWithGoogle = async (): Promise<AuthUser> => {
    const result = await signInWithPopup(auth, googleProvider)
    const fbUser = result.user
    const ref = doc(db, 'users', fbUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: fbUser.uid,
        email: fbUser.email,
        roles: ['client'],
        ownedBusinessIds: [],
        memberBusinessIds: [],
        ownedLocationIds: [],
        adminLocationIds: [],
        providerLocationIds: [],
        clientLocationIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else {
      await updateDoc(ref, { updatedAt: serverTimestamp() })
    }
    // onSnapshot will fire and update user
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (!loading && user) {
          clearInterval(check)
          resolve(user)
        }
      }, 50)
    })
  }

  // Sign up (with role assignment)
  const signUp = async (
    email: string,
    password: string,
    roles: string[]
  ): Promise<AuthUser> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const fbUser = cred.user
    const ref = doc(db, 'users', fbUser.uid)
    await setDoc(ref, {
      uid: fbUser.uid,
      email,
      roles,
      ownedBusinessIds: [],
      memberBusinessIds: [],
      ownedLocationIds: [],
      adminLocationIds: [],
      providerLocationIds: [],
      clientLocationIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    // onSnapshot will fire and update user
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (!loading && user) {
          clearInterval(check)
          resolve(user)
        }
      }, 50)
    })
  }

  const signOutUser = async () => {
    await firebaseSignOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signInWithGoogle, signUp, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
