/**
 * functions-invites/src/handlers/createInvite.ts
 *
 * Cloud Function: createInvite
 *
 * Generates a one-time invite code, saves it in Firestore,
 * and returns it via a Callable onCall trigger.
 *
 * Uses the v2 firebase-functions SDK on Gen-2 (Node 22).
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Admin SDK exactly once
if (!admin.apps.length) {
  admin.initializeApp();
}

export const createInvite = onCall(
  /**
   * @param data – incoming payload; expects { email: string; role?: string }
   * @param context – invocation context, includes auth if signed in
   */
  async (data: any, context: any): Promise<{ inviteCode: string }> => {
    // 1) Require auth
    if (!context.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to create an invite."
      );
    }

    // 2) Validate inputs
    const email = data.email;
    if (typeof email !== "string" || email.trim().length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "A valid 'email' string must be provided."
      );
    }
    const role =
      typeof data.role === "string" && data.role.trim().length > 0
        ? data.role
        : "user";

    try {
      // 3) Generate an 8-character uppercase code
      const inviteCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      // 4) Persist in Firestore
      await admin
        .firestore()
        .collection("invites")
        .doc(inviteCode)
        .set({
          email,
          role,
          createdBy: context.auth.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accepted: false,
        });

      // 5) Return to client
      return { inviteCode };
    } catch (error) {
      console.error("createInvite error:", error);
      throw new HttpsError(
        "internal",
        "Could not create invite at this time."
      );
    }
  }
);
