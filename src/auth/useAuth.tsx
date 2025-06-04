// src/auth/useAuth.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  linkWithPopup,
  User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  roles: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;

  ownedBusinessIds: string[];
  memberBusinessIds: string[];
  ownedLocationIds: string[];
  adminLocationIds: string[];
  providerLocationIds: string[];
  clientLocationIds: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signUp(email: string, password: string, roles: string[]): Promise<AuthUser>;
  signOutUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const googleProvider = new GoogleAuthProvider();

  // ────────────────────────────────────────────────────────────────────────────
  // Normalize a Firestore user document snapshot into our AuthUser shape
  // ────────────────────────────────────────────────────────────────────────────
  function normalizeSnapshot(
    fbUser: FirebaseUser,
    snap: DocumentSnapshot
  ): AuthUser {
    const data = snap.data() as any;
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      roles: Array.isArray(data.roles) ? data.roles : [],
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      ownedBusinessIds: Array.isArray(data.ownedBusinessIds)
        ? data.ownedBusinessIds
        : [],
      memberBusinessIds: Array.isArray(data.memberBusinessIds)
        ? data.memberBusinessIds
        : [],
      ownedLocationIds: Array.isArray(data.ownedLocationIds)
        ? data.ownedLocationIds
        : [],
      adminLocationIds: Array.isArray(data.adminLocationIds)
        ? data.adminLocationIds
        : [],
      providerLocationIds: Array.isArray(data.providerLocationIds)
        ? data.providerLocationIds
        : [],
      clientLocationIds: Array.isArray(data.clientLocationIds)
        ? data.clientLocationIds
        : [],
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Listen to Firebase Auth state. Whenever the user changes:
  //  - Attach a Firestore onSnapshot listener to /users/{uid}
  //  - If the Firestore doc exists, setUser(normalizeSnapshot(...))
  //  - If no Firestore doc, immediately sign out (invalid profile)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setLoading(true);

      // Clean up any previous Firestore listener
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (fbUser) {
        const userRef = doc(db, "users", fbUser.uid);
        unsubProfile = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              const profile = normalizeSnapshot(fbUser, snap);
              setUser(profile);
            } else {
              // No Firestore profile → sign out immediately
              firebaseSignOut(auth);
              setUser(null);
            }
            setLoading(false);
          },
          (err) => {
            // Fallback: in case onSnapshot errors, do getDoc once
            getDoc(userRef)
              .then((fallbackSnap) => {
                if (fallbackSnap.exists()) {
                  setUser(normalizeSnapshot(fbUser, fallbackSnap));
                } else {
                  firebaseSignOut(auth);
                  setUser(null);
                }
              })
              .catch(() => {
                firebaseSignOut(auth);
                setUser(null);
              })
              .finally(() => setLoading(false));
          }
        );
      } else {
        // Signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Email/password sign in
  //    After signInWithEmailAndPassword, onAuthStateChanged + onSnapshot will update `user`
  // ────────────────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    await signInWithEmailAndPassword(auth, email, password);
    return new Promise((resolve) => {
      const waiter = setInterval(() => {
        if (!loading && user) {
          clearInterval(waiter);
          resolve(user);
        }
      }, 50);
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Google sign‐in or link (handles admin’s placeholder → Google migration)
  //
  //    a) If already signed in (email/password), call linkWithPopup to attach Google
  //    b) Otherwise sign in with Google popup
  //    c) Wait for Firestore to recognize the new auth token (getIdTokenResult)
  //    d) If /users/{newUid} exists, update its updatedAt
  //    e) Else, query /users by email to find a placeholderId:
  //         • If placeholder exists → copy placeholderData → /users/{newUid}
  //           and update any serviceProviders/{pid} where userId == placeholderId
  //           to become newUid. Then delete the placeholder.
  //         • If no placeholder found → create new /users/{newUid} as client
  // ────────────────────────────────────────────────────────────────────────────
  const signInWithGoogle = async (): Promise<AuthUser> => {
    let fbUser: FirebaseUser;

    if (auth.currentUser) {
      // Already signed in via email/password → link Google
      try {
        const linkResult = await linkWithPopup(auth.currentUser, googleProvider);
        fbUser = linkResult.user;
      } catch (err) {
        console.error("❌ Google-link error:", err);
        throw err;
      }
    } else {
      // Fresh Google sign in
      try {
        const signInResult = await signInWithPopup(auth, googleProvider);
        fbUser = signInResult.user;
      } catch (err) {
        console.error("❌ Google-signin error:", err);
        throw err;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Wait for Firestore to recognize the new auth token
    // Without this, Firestore rules may still see request.auth as null
    try {
      await fbUser.getIdTokenResult(/* forceRefresh = */ true);
    } catch (err) {
      console.error("❌ getIdTokenResult failed:", err);
      throw err;
    }
    // ──────────────────────────────────────────────────────────────────────────

    const newUid = fbUser.uid;
    const userRef = doc(db, "users", newUid);
    let existingNewSnap: DocumentSnapshot;

    try {
      existingNewSnap = await getDoc(userRef);
    } catch (err) {
      console.error("❌ getDoc(/users/{newUid}) failed:", err);
      throw err;
    }

    if (existingNewSnap.exists()) {
      // (A) If /users/{newUid} already exists, bump updatedAt
      try {
        await updateDoc(userRef, { updatedAt: serverTimestamp() });
      } catch (err) {
        console.error("❌ updateDoc(/users/{newUid}) failed:", err);
        throw err;
      }
    } else {
      // (B) No /users/{newUid} → look for placeholder by matching email
      let placeholderSnap;
      const placeholderQuery = query(
        collection(db, "users"),
        where("email", "==", fbUser.email)
      );
      try {
        placeholderSnap = await getDocs(placeholderQuery);
      } catch (err) {
        console.error("❌ getDocs(query /users where email) failed:", err);
        throw err;
      }

      if (!placeholderSnap.empty) {
        // (B-1) Copy placeholder into new /users/{newUid}
        const placeholderDoc = placeholderSnap.docs[0];
        const placeholderId = placeholderDoc.id;
        const placeholderData = placeholderDoc.data() as any;

        try {
          await setDoc(userRef, {
            ...placeholderData,
            uid: newUid,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("❌ setDoc(/users/{newUid}) failed:", err);
          throw err;
        }

        // (B-2) Migrate any serviceProviders whose userId == placeholderId → userId = newUid
        const spByUserQuery = query(
          collection(db, "serviceProviders"),
          where("userId", "==", placeholderId)
        );
        let spByUserSnap;
        try {
          spByUserSnap = await getDocs(spByUserQuery);
        } catch (err) {
          console.error(
            "❌ getDocs(query /serviceProviders where userId) failed:",
            err
          );
          throw err;
        }

        for (const spDoc of spByUserSnap.docs) {
          try {
            await updateDoc(spDoc.ref, { userId: newUid });
          } catch (err) {
            console.error(
              `❌ updateDoc(/serviceProviders/${spDoc.id}) to set userId → newUid failed:`,
              err
            );
            throw err;
          }
        }

        // (B-3) Delete the old placeholder /users/{placeholderId}
        try {
          await deleteDoc(doc(db, "users", placeholderId));
        } catch (err) {
          console.error("❌ deleteDoc(/users/{placeholderId}) failed:", err);
          throw err;
        }
      } else {
        // (C) No placeholder → brand‐new Google user ⇒ create as client
        try {
          await setDoc(userRef, {
            uid: newUid,
            email: fbUser.email,
            roles: ["client"],
            ownedBusinessIds: [],
            memberBusinessIds: [],
            ownedLocationIds: [],
            adminLocationIds: [],
            providerLocationIds: [],
            clientLocationIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("❌ setDoc(/users/{newUid}) as client failed:", err);
          throw err;
        }
      }
    }

    // Wait for onSnapshot to pick up the new/updated /users/{newUid}
    return new Promise((resolve) => {
      const waiter = setInterval(() => {
        if (!loading && user) {
          clearInterval(waiter);
          resolve(user);
        }
      }, 50);
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Sign up (email/password) with explicit roles
  //    After createUserWithEmailAndPassword, we write /users/{uid} with whatever roles
  // ────────────────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    roles: string[]
  ): Promise<AuthUser> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;
    const userRef = doc(db, "users", fbUser.uid);

    await setDoc(userRef, {
      uid: fbUser.uid,
      email: email,
      roles,
      ownedBusinessIds: [],
      memberBusinessIds: [],
      ownedLocationIds: [],
      adminLocationIds: [],
      providerLocationIds: [],
      clientLocationIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return new Promise((resolve) => {
      const waiter = setInterval(() => {
        if (!loading && user) {
          clearInterval(waiter);
          resolve(user);
        }
      }, 50);
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 4) Sign out
  // ────────────────────────────────────────────────────────────────────────────
  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
