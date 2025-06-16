// src/data/FirestorePaymentCredentialStore.ts

/**
 * FirestorePaymentCredentialStore.ts
 *
 * Firestore-backed implementation of PaymentCredentialStore.
 *
 * - getByOwner(): queries provider/ownerType/ownerId AND toBeUsedBy==ownerId
 * - save(): upserts all fields, encrypting accessToken at rest,
 *           merging so you never lose extra fields.
 */

import { PaymentCredential } from "../models/PaymentCredential";
import { PaymentCredentialStore } from "./PaymentCredentialStore";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  Timestamp,
  doc,
  DocumentReference,
  CollectionReference,
} from "firebase/firestore";
import { encrypt, decrypt } from "../utils/encryption";

const COLLECTION = "paymentCredentials";

export class FirestorePaymentCredentialStore
  implements PaymentCredentialStore
{
  private collRef: CollectionReference = collection(db, COLLECTION);

  async getByOwner(
    provider: string,
    ownerType: string,
    ownerId: string
  ): Promise<PaymentCredential | null> {
    // Query by provider, ownerType, ownerId AND ensure toBeUsedBy = ownerId
    const q = query(
      this.collRef,
      where("provider", "==", provider),
      where("ownerType", "==", ownerType),
      where("ownerId", "==", ownerId),
      where("toBeUsedBy", "==", ownerId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const raw = docSnap.data() as PaymentCredential;

    // Decrypt the accessToken before returning
    return {
      id: docSnap.id,
      ...raw,
      credentials: {
        ...raw.credentials,
        accessToken: raw.credentials.accessToken
          ? decrypt(raw.credentials.accessToken)
          : "",
      },
    };
  }

  async save(credential: PaymentCredential): Promise<void> {
    const now = Timestamp.now();

    // Use existing docRef if id is present, else generate a new one
    const docRef: DocumentReference =
      credential.id !== undefined
        ? doc(db, COLLECTION, credential.id)
        : doc(this.collRef);

    // Strip out `id`, Firestore key lives in docRef.id
    const { id, ...rest } = credential;

    const payload: Omit<PaymentCredential, "id"> = {
      ...rest,
      // Encrypt the accessToken at rest
      credentials: {
        ...rest.credentials,
        accessToken: rest.credentials.accessToken
          ? encrypt(rest.credentials.accessToken)
          : "",
      },
      createdAt: rest.createdAt || now,
      updatedAt: now,
    };

    // Merge so we don’t clobber any unrelated fields
    await setDoc(docRef, payload, { merge: true });
  }
}
