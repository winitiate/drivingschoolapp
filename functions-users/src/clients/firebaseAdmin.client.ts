/**
 * firebaseAdmin.client.ts
 *
 * Centralised singleton for Firebase Admin SDK.
 * Import { db, auth } anywhere instead of re-initialising Admin.
 */
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const auth = admin.auth();
export const db   = admin.firestore();
export { admin };                 // full SDK if you ever need it
