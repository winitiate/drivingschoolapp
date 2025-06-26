/**
 * business.service.ts
 *
 * Logic reused by createBusiness.handler and onBusinessWrite trigger.
 */
import { db, admin } from "../clients/firebaseAdmin.client";
import { ensureAuthUser, ensureUserProfile } from "./user.service";

export interface BusinessPayload {
  name: string;
  ownerEmail: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
  notes?: string;
  address?: Record<string, any>;
  ownerName?: string;
  ownerPhone?: string;
}

export async function createBusinessDoc(
  p: BusinessPayload
): Promise<{ businessId: string; ownerUid: string }> {
  const ownerUid = await ensureAuthUser(p.ownerEmail);
  await ensureUserProfile(ownerUid, p.ownerEmail, { role: "businessOwner" });

  const ref = db.collection("businesses").doc();
  await ref.set({
    id: ref.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...p,
    ownerId: ownerUid,
    ownerIds: [ownerUid],
    ownerEmails: [p.ownerEmail],
  });

  await db
    .collection("users")
    .doc(ownerUid)
    .update({
      ownedBusinessIds: admin.firestore.FieldValue.arrayUnion(ref.id),
    });

  return { businessId: ref.id, ownerUid };
}

export async function backfillOwnerFromEmail(
  bizId: string,
  ownerEmail: string
) {
  const ownerUid = await ensureAuthUser(ownerEmail);
  await ensureUserProfile(ownerUid, ownerEmail, {
    role: "businessOwner",
    businessId: bizId,
  });

  await db
    .collection("businesses")
    .doc(bizId)
    .set(
      {
        ownerId: ownerUid,
        ownerIds: admin.firestore.FieldValue.arrayUnion(ownerUid),
      },
      { merge: true }
    );
}
