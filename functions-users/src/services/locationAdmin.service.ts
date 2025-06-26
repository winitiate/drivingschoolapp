import { db, admin } from "../clients/firebaseAdmin.client";
import { ensureAuthUser, ensureUserProfile } from "./user.service";
import { LocationAdminPayload } from "../types/locationAdmin.types";

const COLLECTION = "serviceLocationAdmins";

export async function createLocationAdmin(
  payload: LocationAdminPayload
): Promise<{ adminId: string; uid: string }> {
  const uid = await ensureAuthUser(payload.email);
  await ensureUserProfile(uid, payload.email, { role: "serviceLocationAdmin" });

  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    id: ref.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    userId: uid,
    serviceLocationId: payload.serviceLocationId,
    permissions: payload.permissions ?? [],
    status: "active",
  });

  await db
    .collection("users")
    .doc(uid)
    .update({
      adminLocationIds: admin.firestore.FieldValue.arrayUnion(
        payload.serviceLocationId
      ),
    });

  return { adminId: ref.id, uid };
}
