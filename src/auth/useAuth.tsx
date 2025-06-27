/**
 * useAuth.tsx
 * -----------------------------------------------------------------------------
 * Centralised authentication hook with:
 *   • Firebase Auth state listener  ➜ real-time Firestore profile
 *   • Email / Password sign-in & sign-up
 *   • Google sign-in
 *   • Multi-provider account linking
 * -----------------------------------------------------------------------------
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
  EmailAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  User as FirebaseUser,
  AuthCredential,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db } from "../firebase";

/* ──────────────────────────────────────────────────────────────────────────
 * Local Firestore-document & context types
 * ──────────────────────────────────────────────────────────────────────── */
interface FirestoreUserDoc {
  roles?: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;

  ownedBusinessIds?: string[];
  memberBusinessIds?: string[];
  ownedLocationIds?: string[];
  adminLocationIds?: string[];
  providerLocationIds?: string[];
  clientLocationIds?: string[];
}

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

/* ──────────────────────────────────────────────────────────────────────────
 * Provider
 * ──────────────────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  /* Convert a Firestore snapshot into AuthUser --------------------------------*/
  function normaliseSnapshot(
    fbUser: FirebaseUser,
    snap: DocumentSnapshot<FirestoreUserDoc>
  ): AuthUser {
    const d = snap.data()!;
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      roles: d.roles ?? [],

      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,

      ownedBusinessIds: d.ownedBusinessIds ?? [],
      memberBusinessIds: d.memberBusinessIds ?? [],
      ownedLocationIds: d.ownedLocationIds ?? [],
      adminLocationIds: d.adminLocationIds ?? [],
      providerLocationIds: d.providerLocationIds ?? [],
      clientLocationIds: d.clientLocationIds ?? [],
    };
  }

  /* Listen for auth changes + user-doc updates ------------------------------- */
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setLoading(true);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (fbUser) {
        const ref = doc(db, "users", fbUser.uid);

        unsubProfile = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              setUser(normaliseSnapshot(fbUser, snap));
            } else {
              firebaseSignOut(auth);
              setUser(null);
            }
            setLoading(false);
          },
          async () => {
            try {
              const once = await getDoc(ref);
              if (once.exists()) {
                setUser(normaliseSnapshot(fbUser, once));
              } else {
                firebaseSignOut(auth);
                setUser(null);
              }
            } finally {
              setLoading(false);
            }
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
   *  Multi-provider account-linking helpers
   * ────────────────────────────────────────────────────────────────────── */

  type ProviderMismatchError = FirebaseError & {
    customData?: { email?: string };
  };

  async function linkAfterProviderMismatch(
    error: ProviderMismatchError
  ): Promise<AuthUser> {
    const pendingCred = GoogleAuthProvider.credentialFromError(
      error
    ) as AuthCredential;
    const email = error.customData?.email ?? "";
    const providers = await fetchSignInMethodsForEmail(auth, email);

    if (providers.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)) {
      const pwd = window.prompt(
        `An account for ${email} already exists with a password.\n` +
          `Please enter that password once so we can link your Google login.`
      );
      if (!pwd) throw new Error("Password linkage aborted by user.");

      const emailUserCred = await signInWithEmailAndPassword(auth, email, pwd);
      await linkWithCredential(emailUserCred.user, pendingCred);
      return waitForUserObject();
    }

    if (providers.length) {
      alert(
        `An account for ${email} exists with ${providers[0]}. ` +
          `Finish that sign-in and we’ll link Google automatically.`
      );
      const primaryProv = new GoogleAuthProvider();
      const primaryResult = await signInWithPopup(auth, primaryProv);
      await linkWithCredential(primaryResult.user, pendingCred);
      return waitForUserObject();
    }

    throw error;
  }

  function waitForUserObject(): Promise<AuthUser> {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (!loading && user) {
          clearInterval(t);
          resolve(user);
        }
      }, 50);
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
   *  Public auth actions
   * ────────────────────────────────────────────────────────────────────── */

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (
        err instanceof FirebaseError &&
        err.code === "auth/account-exists-with-different-credential"
      ) {
        return linkAfterProviderMismatch(err as ProviderMismatchError);
      }
      throw err;
    }
    return waitForUserObject();
  };

  const signInWithGoogle = async (): Promise<AuthUser> => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (
        err instanceof FirebaseError &&
        err.code === "auth/account-exists-with-different-credential"
      ) {
        return linkAfterProviderMismatch(err as ProviderMismatchError);
      }
      throw err;
    }

    const fbUser = auth.currentUser!;
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: fbUser.uid,
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
    } else {
      await updateDoc(ref, { updatedAt: serverTimestamp() });
    }

    return waitForUserObject();
  };

  const signUp = async (
    email: string,
    password: string,
    roles: string[]
  ): Promise<AuthUser> => {
    await createUserWithEmailAndPassword(auth, email, password);

    const fbUser = auth.currentUser!;
    const ref = doc(db, "users", fbUser.uid);
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
    });
    return waitForUserObject();
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  /* Context value */
  const ctxVal: AuthContextType = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOutUser,
  };

  return <AuthContext.Provider value={ctxVal}>{children}</AuthContext.Provider>;
}

/* ────────────────────────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
