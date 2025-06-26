/**
 * user.service.ts
 *
 * Helper functions around the central users/{uid} profile.
 */
import { db, auth, admin } from "../clients/firebaseAdmin.client";

export async function ensureAuthUser(email: string): Promise<string> {
  try {
    return (await auth.getUserByEmail(email)).uid;
  } catch {
    return (await auth.createUser({ email })).uid;
  }
}

/**
 * ensureUserProfile
 *   • merges role + owned/business/location arrays
 *   • creates the profile if missing
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  extra: Partial<{ role: string; businessId: string; locationId: string }>
): Promise<void> {
  const ref = db.collection("users").doc(uid);

  const update: Record<string, any> = {
    uid,
    email,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (extra.role) {
    update.roles = admin.firestore.FieldValue.arrayUnion(extra.role);
  }
  if (extra.businessId) {
    update.ownedBusinessIds = admin.firestore.FieldValue.arrayUnion(
      extra.businessId
    );
  }
  if (extra.locationId) {
    update.adminLocationIds = admin.firestore.FieldValue.arrayUnion(
      extra.locationId
    );
  }

  await ref.set(update, { merge: true });
}
