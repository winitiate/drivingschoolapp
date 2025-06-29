/*  functions-users/src/services/serviceProvider.service.ts  */

import { getAuth }      from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

import type {
  CreateServiceProviderInput,
  CreateServiceProviderResult,
} from "../types/serviceProvider.types";

/**
 * createServiceProviderService
 * ------------------------------------------------------------------
 * • find-or-create Firebase Auth user
 * • merge Firestore user profile (roles, location linkage, names, …)
 * • create **or update** the serviceProviders/<id> document
 */
export async function createServiceProviderService(
  input: CreateServiceProviderInput & { providerId?: string }   // ← providerId optional for “edit” calls
): Promise<CreateServiceProviderResult> {
  const auth = getAuth();
  const db   = getFirestore();

  /* ───────── 1)  Auth user (find-or-create) ───────── */
  let user = await auth.getUserByEmail(input.email).catch(() => null);

  if (!user) {
    user = await auth.createUser({ email: input.email });
  }
  const uid = user.uid;

  /* ───────── 2)  Firestore profile merge ──────────── */
  const userRef = db.doc(`users/${uid}`);
  await userRef.set(
    {
      email: input.email,
      firstName: input.firstName ?? "",
      lastName:  input.lastName  ?? "",
      roles:            ["serviceProvider"],
      providerLocationIds: input.providerLocationIds,
      updatedAt: new Date(),
      createdAt: new Date(),          // will be ignored if already exists
    },
    { merge: true }
  );

  /* ───────── 3)  Service-provider doc ─────────────── */
  const providerId = input.providerId ?? uuidv4();
  const spRef      = db.doc(`serviceProviders/${providerId}`);

  await spRef.set(
    {
      id:   providerId,
      userId: uid,
      email:     input.email,
      firstName: input.firstName ?? "",
      lastName:  input.lastName  ?? "",
      providerLocationIds: input.providerLocationIds,
      customFields: input.customFields ?? {},
      updatedAt: new Date(),
      createdAt: new Date(),          // same: ignored on merge
    },
    { merge: true }
  );

  /* ───────── 4)  Result – always with userUid ─────── */
  const result: CreateServiceProviderResult = {
    success: true,
    providerId,
    userUid: uid,        //  <-- front-end relies on this key
  };

  return result;
}
