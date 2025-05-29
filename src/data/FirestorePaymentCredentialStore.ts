// src/data/FirestorePaymentCredentialStore.ts

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
    const q = query(
      this.collRef,
      where("provider", "==", provider),
      where("ownerType", "==", ownerType),
      where("ownerId", "==", ownerId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const raw = docSnap.data() as PaymentCredential;

    return {
      id: docSnap.id,
      ...raw,
      credentials: {
        ...raw.credentials,
        accessToken: raw.credentials?.accessToken
          ? decrypt(raw.credentials.accessToken)
          : "",
      },
    };
  }

  async save(credential: PaymentCredential): Promise<void> {
    const now = Timestamp.now();

    const docRef: DocumentReference =
      credential.id !== undefined
        ? doc(db, COLLECTION, credential.id)
        : doc(this.collRef);

    const { id, ...rest } = credential; // remove id from the payload

    const payload: PaymentCredential = {
      ...rest,
      credentials: {
        ...credential.credentials,
        accessToken: credential.credentials.accessToken
          ? encrypt(credential.credentials.accessToken)
          : "",
      },
      createdAt: credential.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, payload, { merge: true });
  }
}
