import { db, admin } from "../clients/firebaseAdmin.client";
import { ensureAuthUser, ensureUserProfile } from "./user.service";
import { ProviderPayload } from "../types/provider.types";

/** Collection name kept consistent with your front-end store */
const COLLECTION = "serviceProviders";

export async function createProvider(
  payload: ProviderPayload
): Promise<{ providerId: string; uid: string }> {
  // 1️⃣  Ensure Auth user + user profile
  const uid = await ensureAuthUser(payload.email);
  await ensureUserProfile(uid, payload.email, {
    role: "serviceProvider",
  });

  // 2️⃣  Write provider doc
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    id: ref.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    userId: uid,
    providerLocationIds: payload.providerLocationIds,
    firstName: payload.firstName ?? "",
    lastName: payload.lastName ?? "",
    customFields: payload.customFields ?? {},
    status: "active",
  });

  // 3️⃣  Append locationIds + role to user profile
  await ensureUserProfile(uid, payload.email, {
    role: "serviceProvider",
  });
  await db
    .collection("users")
    .doc(uid)
    .update({
      providerLocationIds: admin.firestore.FieldValue.arrayUnion(
        ...payload.providerLocationIds
      ),
    });

  return { providerId: ref.id, uid };
}
