// functions-users/src/services/businessOwner.service.ts

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { CreateBusinessOwnerInput, CreateBusinessOwnerResult } from "../types/businessOwner.types";

export async function createBusinessOwnerService(
  input: CreateBusinessOwnerInput
): Promise<CreateBusinessOwnerResult> {
  const auth = getAuth();
  const db = getFirestore();

  let userRecord;

  // Check if user already exists
  try {
    userRecord = await auth.getUserByEmail(input.email);
  } catch {
    // Create user if not found
    userRecord = await auth.createUser({
      email: input.email,
      emailVerified: false,
      disabled: false,
    });
  }

  const uid = userRecord.uid;

  // Attach Firestore profile
  const userRef = db.collection("users").doc(uid);
  await userRef.set(
    {
      email: input.email,
      roles: ["business"],
      ownedBusinessIds: input.businessId ? [input.businessId] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return {
    success: true,
    uid,
  };
}
