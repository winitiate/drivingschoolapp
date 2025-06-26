/**
 * useAuth.tsx
 * -----------------------------------------------------------------------------
 * Centralised authentication hook with:
 *   • Firebase Auth state listener  ➜ real-time Firestore profile
 *   • Email / Password sign-in & sign-up
 *   • Google sign-in
 *   • **Multi-provider account linking**  ← NEW
 *
 * Provider-linking strategy
 * -------------------------
 * If the user tries to sign in with provider B and Firebase throws
 * `auth/account-exists-with-different-credential`, we:
 *
 *   1. Extract the *pending* credential from the error (this is provider B).
 *   2. Fetch which provider(s) already exist for that e-mail (provider A).
 *   3. Sign-in with provider A (silent popup for Google, password prompt for
 *      email/password).
 *   4. Immediately call linkWithCredential(user, pendingCred) so both creds
 *      merge under the *original* UID. One user doc → no duplicates.
 *
 * UI prompts are kept minimal for now (window.prompt / alert). Swap these for
 * a proper MUI dialog later if you like.
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
import { auth, db } from "../firebase";

/* ────────────────────────────────────────────────────────────────────────────
 * Local types
 * ────────────────────────────────────────────────────────────────────────── */
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

  /** E-mail + password sign-in */
  signIn(email: string, password: string): Promise<AuthUser>;

  /** Google sign-in */
  signInWithGoogle(): Promise<AuthUser>;

  /** E-mail + password sign-up (caller supplies starting roles) */
  signUp(email: string, password: string, roles: string[]): Promise<AuthUser>;

  /** Firebase sign-out */
  signOutUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ────────────────────────────────────────────────────────────────────────────
 * Provider component
 * ────────────────────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* Google provider configured for one-tap & popup */
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  /* Helper – normalise Firestore snapshot into AuthUser -------------------- */
  function normaliseSnapshot(
    fbUser: FirebaseUser,
    snap: DocumentSnapshot
  ): AuthUser {
    const d = snap.data() as any;
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      roles: Array.isArray(d.roles) ? d.roles : [],

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

  /* ───── Listen for Firebase Auth changes + Firestore user doc ─────────── */
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
              // Auth user has no Firestore profile → force sign-out to stay
              // consistent.
              firebaseSignOut(auth);
              setUser(null);
            }
            setLoading(false);
          },
          async () => {
            // Snapshot failed (permissions?) → fall back to one-shot fetch
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

  /**
   * linkAfterProviderMismatch
   * -------------------------
   * Called when Firebase throws `auth/account-exists-with-different-credential`.
   * We:
   *   1. Grab the pending (second) credential.
   *   2. Sign-in with the *existing* provider for that e-mail.
   *   3. Link the pending credential to that user.
   */
  async function linkAfterProviderMismatch(
    error: any
  ): Promise<AuthUser | never> {
    const pendingCred = GoogleAuthProvider.credentialFromError(
      error
    ) as AuthCredential;
    const email: string = error?.customData?.email;
    const providers = await fetchSignInMethodsForEmail(auth, email);

    // Case A – existing provider is email/password
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

    // Case B – existing provider is another IdP (e.g. Google⇒Facebook edge case)
    if (providers.length) {
      alert(
        `An account for ${email} exists with ${providers[0]}. ` +
          `Finish that sign-in and we’ll link Google automatically.`
      );
      // Redirect sign-in with that provider (popup) and link inside its flow.
      // For simplicity we assume provider[0] is Google – tweak if you add FB.
      const primaryProv = new GoogleAuthProvider();
      const primaryResult = await signInWithPopup(auth, primaryProv);
      await linkWithCredential(primaryResult.user, pendingCred);
      return waitForUserObject();
    }

    // Fallback – shouldn’t happen
    throw error;
  }

  /* Await until onAuthStateChanged + onSnapshot populate `user` ------------- */
  function waitForUserObject(): Promise<AuthUser> {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!loading && user) {
          clearInterval(check);
          resolve(user);
        }
      }, 50);
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
   *  Public auth actions
   * ────────────────────────────────────────────────────────────────────── */

  /** Email / password sign-in */
  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // If user mistypes pwd we still throw – only intercept linkage errors
      if (err.code === "auth/account-exists-with-different-credential") {
        return linkAfterProviderMismatch(err);
      }
      throw err;
    }
    return waitForUserObject();
  };

  /** Google sign-in (popup) – now with account linking */
  const signInWithGoogle = async (): Promise<AuthUser> => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === "auth/account-exists-with-different-credential") {
        return linkAfterProviderMismatch(err);
      }
      throw err;
    }

    /* Ensure a Firestore profile exists (first-time Google login) */
    const fbUser = auth.currentUser!;
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: fbUser.uid,
        email: fbUser.email,
        roles: ["client"], // default – promote later via invite
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

  /** Email / Password sign-up */
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

  /** Sign-out */
  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  /* ── Context value ────────────────────────────────────────────────────── */
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
