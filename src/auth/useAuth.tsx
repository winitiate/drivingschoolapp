// src/auth/useAuth.tsx

/**
 * useAuth.tsx
 *
 * This module provides a React context (`AuthContext`) and hook (`useAuth`)
 * for managing authentication and user profiles in Firestore. It supports:
 *
 * 1. Email/password sign‐in and sign‐up (with explicit roles).
 * 2. Google OAuth sign‐in and linking (migrates any existing "placeholder"
 *    user document in Firestore into the new UID, or creates a new user document if none exists).
 * 3. A robust onAuthStateChanged handler that:
 *      • First attempts a direct getDoc("/users/{uid}").
 *      • If that doc exists, it uses onSnapshot to keep the user profile up to date.
 *      • If it does not exist, it runs a query-by-email fallback to migrate a placeholder
 *        document or create a brand‐new user document.
 *      • Ensures no “permission denied” errors by always fetching by UID first (allowed by rules),
 *        then falling back to a query-by-email only if necessary (allowed by rules when email matches).
 *
 * Important:
 *   - Firestore security rules for /users/{userId} must be:
 *       match /users/{userId} {
 *         allow get:    if request.auth != null && request.auth.uid == userId;
 *         allow list:   if request.auth != null 
 *                       && resource.data.email == request.auth.token.email;
 *         allow create: if request.auth != null && request.auth.uid == userId;
 *         allow update, delete: if request.auth != null && request.auth.uid == userId;
 *       }
 *     (No broader “list” or “get” permissions are granted.)
 *
 *   - This file assumes you have initialized Firestore and Auth in ../firebase.tsx:
 *       export const auth = getAuth(app);
 *       export const db   = getFirestore(app);
 */

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
  //   • First attempt a direct getDoc("/users/{uid}").
  //   • If it exists, attach onSnapshot to keep in sync.
  //   • If it does not exist, fall back to querying by email to migrate placeholder
  //     or create a brand‐new document.
  //   • If no valid Firestore profile emerges, sign out.
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (fbUser) => {
        setLoading(true);

        // Clean up any previous listener on /users/{uid}
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }

        if (fbUser) {
          const uid = fbUser.uid;
          const email = fbUser.email || "";
          const userRef = doc(db, "users", uid);

          try {
            // 1) Try direct get("/users/{uid}")
            const snap = await getDoc(userRef);

            if (snap.exists()) {
              // 2a) Document exists → attach onSnapshot for real‐time updates
              unsubProfile = onSnapshot(
                userRef,
                (realSnap) => {
                  if (realSnap.exists()) {
                    const profile = normalizeSnapshot(
                      fbUser,
                      realSnap
                    );
                    setUser(profile);
                  } else {
                    // This should rarely happen: if doc was deleted behind our back,
                    // sign the user out.
                    firebaseSignOut(auth);
                    setUser(null);
                  }
                  setLoading(false);
                },
                (err) => {
                  // If onSnapshot errors, fallback to a single getDoc
                  getDoc(userRef)
                    .then((fallbackSnap) => {
                      if (fallbackSnap.exists()) {
                        setUser(
                          normalizeSnapshot(fbUser, fallbackSnap)
                        );
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
              // 2b) No doc under /users/{uid} → fallback to email query
              const placeholderQuery = query(
                collection(db, "users"),
                where("email", "==", email)
              );
              const querySnap = await getDocs(placeholderQuery);

              if (!querySnap.empty) {
                // 2b-i) Found placeholder by email → migrate
                const placeholderDoc = querySnap.docs[0];
                const placeholderId = placeholderDoc.id;
                const placeholderData = placeholderDoc.data() as any;

                // Copy placeholderData → /users/{uid}
                await setDoc(userRef, {
                  ...placeholderData,
                  uid,
                  updatedAt: serverTimestamp(),
                });

                // Migrate any serviceProviders where userId == placeholderId
                const spByUserQuery = query(
                  collection(db, "serviceProviders"),
                  where("userId", "==", placeholderId)
                );
                const spByUserSnap = await getDocs(spByUserQuery);
                for (const spDoc of spByUserSnap.docs) {
                  await updateDoc(spDoc.ref, { userId: uid });
                }

                // Delete old placeholder
                await deleteDoc(placeholderDoc.ref);

                // Now attach onSnapshot to /users/{uid}
                unsubProfile = onSnapshot(
                  userRef,
                  (newSnap) => {
                    if (newSnap.exists()) {
                      setUser(
                        normalizeSnapshot(fbUser, newSnap)
                      );
                    } else {
                      firebaseSignOut(auth);
                      setUser(null);
                    }
                    setLoading(false);
                  },
                  (err) => {
                    getDoc(userRef)
                      .then((newSnap) => {
                        if (newSnap.exists()) {
                          setUser(
                            normalizeSnapshot(fbUser, newSnap)
                          );
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
                // 2b-ii) No placeholder → brand‐new user (Google or email signup)
                // Create new document with default role "client"
                const now = serverTimestamp();
                await setDoc(userRef, {
                  uid,
                  email,
                  roles: ["client"],
                  ownedBusinessIds: [],
                  memberBusinessIds: [],
                  ownedLocationIds: [],
                  adminLocationIds: [],
                  providerLocationIds: [],
                  clientLocationIds: [],
                  createdAt: now,
                  updatedAt: now,
                });

                unsubProfile = onSnapshot(
                  userRef,
                  (newSnap) => {
                    if (newSnap.exists()) {
                      setUser(
                        normalizeSnapshot(fbUser, newSnap)
                      );
                    } else {
                      firebaseSignOut(auth);
                      setUser(null);
                    }
                    setLoading(false);
                  },
                  (err) => {
                    getDoc(userRef)
                      .then((newSnap) => {
                        if (newSnap.exists()) {
                          setUser(
                            normalizeSnapshot(fbUser, newSnap)
                          );
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
              }
            }
          } catch (err) {
            console.error("Error in onAuthStateChanged handler:", err);
            firebaseSignOut(auth);
            setUser(null);
            setLoading(false);
          }
        } else {
          // Signed out
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Email/password sign in
  //    After signInWithEmailAndPassword, onAuthStateChanged will run above code
  // ────────────────────────────────────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
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
  // 2) Google sign‐in or link (handles migrating placeholders)
  //    a) If already signed in (email/password), link provider.
  //    b) Otherwise do signInWithPopup.
  //    c) Wait for Firestore rules to update with new token.
  //    d) Migrate or create /users/{uid} document as needed.
  // ────────────────────────────────────────────────────────────────────────────
  const signInWithGoogle = async (): Promise<AuthUser> => {
    let fbUser: FirebaseUser;

    if (auth.currentUser) {
      // Already signed in: link Google to existing account
      try {
        const linkResult = await linkWithPopup(
          auth.currentUser!,
          googleProvider
        );
        fbUser = linkResult.user;
      } catch (err) {
        console.error("Google link error:", err);
        throw err;
      }
    } else {
      // Fresh Google sign in
      try {
        const signInResult = await signInWithPopup(
          auth,
          googleProvider
        );
        fbUser = signInResult.user;
      } catch (err) {
        console.error("Google sign‐in error:", err);
        throw err;
      }
    }

    // Wait for Firestore to recognize the new token
    try {
      await fbUser.getIdTokenResult(true);
    } catch (err) {
      console.error("getIdTokenResult error:", err);
      throw err;
    }

    const newUid = fbUser.uid;
    const userRef = doc(db, "users", newUid);
    let existingNewSnap: DocumentSnapshot;

    try {
      existingNewSnap = await getDoc(userRef);
    } catch (err) {
      console.error("getDoc(/users/{newUid}) error:", err);
      throw err;
    }

    if (existingNewSnap.exists()) {
      // (A) Already have /users/{newUid} → bump updatedAt
      try {
        await updateDoc(userRef, { updatedAt: serverTimestamp() });
      } catch (err) {
        console.error("updateDoc(/users/{newUid}) error:", err);
        throw err;
      }
    } else {
      // (B) No /users/{newUid} → look for placeholder by email
      let placeholderSnap;
      const placeholderQuery = query(
        collection(db, "users"),
        where("email", "==", fbUser.email)
      );
      try {
        placeholderSnap = await getDocs(placeholderQuery);
      } catch (err) {
        console.error(
          "getDocs(query /users where email) error:",
          err
        );
        throw err;
      }

      if (!placeholderSnap.empty) {
        // (B-1) Migrate placeholder → /users/{newUid}
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
          console.error("setDoc(/users/{newUid}) error:", err);
          throw err;
        }

        // (B-2) Migrate serviceProviders where userId == placeholderId
        const spByUserQuery = query(
          collection(db, "serviceProviders"),
          where("userId", "==", placeholderId)
        );
        let spByUserSnap;
        try {
          spByUserSnap = await getDocs(spByUserQuery);
        } catch (err) {
          console.error(
            "getDocs(query /serviceProviders where userId) error:",
            err
          );
          throw err;
        }

        for (const spDoc of spByUserSnap.docs) {
          try {
            await updateDoc(spDoc.ref, { userId: newUid });
          } catch (err) {
            console.error(
              `updateDoc(/serviceProviders/${spDoc.id}) error:`,
              err
            );
            throw err;
          }
        }

        // (B-3) Delete placeholder
        try {
          await deleteDoc(placeholderDoc.ref);
        } catch (err) {
          console.error("deleteDoc(/users/{placeholderId}) error:", err);
          throw err;
        }
      } else {
        // (C) No placeholder found → brand‐new Google user
        try {
          await setDoc(userRef, {
            uid: newUid,
            email: fbUser.email,
            roles: ["client"], // default role
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
          console.error(
            "setDoc(/users/{newUid}) as client error:",
            err
          );
          throw err;
        }
      }
    }

    // Wait for the auth‐listener and onSnapshot to fire
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
  //    After createUserWithEmailAndPassword, write /users/{uid}
  // ────────────────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    roles: string[]
  ): Promise<AuthUser> => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
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
  if (!ctx)
    throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
