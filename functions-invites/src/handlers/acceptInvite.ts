/**
 * functions-invites/src/handlers/acceptInvite.ts
 *
 * Cloud Function: acceptInvite
 *
 * Marks a one-time invite code as accepted in Firestore,
 * and optionally sets a custom user claim for role.
 *
 * Uses the v2 firebase-functions SDK on Gen-2 (Node 22).
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Admin SDK exactly once
if (!admin.apps.length) {
  admin.initializeApp();
}

export const acceptInvite = onCall(
  /**
   * @param data – incoming payload; expects { inviteCode: string }
   * @param context – invocation context, includes auth if signed in
   */
  async (data: any, context: any): Promise<{ success: true }> => {
    // 1) Require auth
    if (!context.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to accept an invite."
      );
    }

    // 2) Validate inputs
    const inviteCode = data.inviteCode;
    if (typeof inviteCode !== "string" || inviteCode.trim().length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "A valid 'inviteCode' string must be provided."
      );
    }

    try {
      // 3) Fetch the invite doc
      const ref = admin.firestore().collection("invites").doc(inviteCode);
      const snap = await ref.get();

      if (!snap.exists) {
        throw new HttpsError("not-found", "Invite code not found.");
      }

      const inviteData = snap.data()!;
      // 4) Prevent reuse
      if (inviteData.accepted) {
        throw new HttpsError(
          "failed-precondition",
          "This invite has already been accepted."
        );
      }

      // 5) Mark accepted
      await ref.update({
        accepted: true,
        acceptedBy: context.auth.uid,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6) Apply role claim if provided
      if (inviteData.role) {
        await admin.auth().setCustomUserClaims(context.auth.uid, {
          role: inviteData.role,
        });
      }

      // 7) Return success
      return { success: true };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("acceptInvite error:", err);
      throw new HttpsError(
        "internal",
        "Could not accept invite at this time."
      );
    }
  }
);
