import { db, admin } from "../clients/firebaseAdmin.client";
import { ensureAuthUser, ensureUserProfile } from "./user.service";
import { ClientPayload } from "../types/client.types";

const COLLECTION = "clients";

export async function createClient(
  payload: ClientPayload
): Promise<{ clientId: string; uid: string }> {
  const uid = await ensureAuthUser(payload.email);
  await ensureUserProfile(uid, payload.email, { role: "client" });

  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    id: ref.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    userId: uid,
    clientLocationIds: payload.clientLocationIds,
    firstName: payload.firstName ?? "",
    lastName: payload.lastName ?? "",
    customFields: payload.customFields ?? {},
    status: "active",
  });

  await db
    .collection("users")
    .doc(uid)
    .update({
      clientLocationIds: admin.firestore.FieldValue.arrayUnion(
        ...payload.clientLocationIds
      ),
    });

  return { clientId: ref.id, uid };
}
