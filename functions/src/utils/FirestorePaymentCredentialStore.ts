// functions/src/utils/FirestorePaymentCredentialStore.ts

/**
 * FirestorePaymentCredentialStore.ts
 *
 * Firestore‐Admin‐SDK implementation of PaymentCredentialStore.
 * Now always decrypts the stored accessToken so Square calls
 * are authenticated correctly.
 */

import * as admin from "firebase-admin";
import {
  PaymentCredential,
  PaymentCredentialStore,
} from "./PaymentCredentialStore";
import { decrypt } from "./encryption";

// Initialize Admin SDK once
if (!admin.apps.length) admin.initializeApp();

const db       = admin.firestore();
const COLLNAME = "paymentCredentials";

export class FirestorePaymentCredentialStore
  implements PaymentCredentialStore
{
  private coll = db.collection(COLLNAME);

  /**
   * Load the one credential matching provider + toBeUsedBy.
   */
  async getByConsumer(
    provider: string,
    toBeUsedBy: string
  ): Promise<PaymentCredential | null> {
    const snap = await this.coll
      .where("provider", "==", provider)
      .where("toBeUsedBy", "==", toBeUsedBy)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const raw = doc.data() as PaymentCredential;

    // **Always decrypt** the stored token
    const encryptedToken = raw.credentials.accessToken || "";
    const decryptedToken = encryptedToken
      ? decrypt(encryptedToken)
      : "";

    return {
      id:         doc.id,
      provider:   raw.provider,
      ownerType:  raw.ownerType,
      ownerId:    raw.ownerId,
      toBeUsedBy: raw.toBeUsedBy,
      credentials: {
        applicationId: raw.credentials.applicationId,
        accessToken:   decryptedToken,
      },
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  /**
   * Upsert a credential.
   */
  async save(credential: PaymentCredential): Promise<void> {
    const now = admin.firestore.Timestamp.now();
    const ref = credential.id
      ? this.coll.doc(credential.id)
      : this.coll.doc();

    const { id, ...rest } = credential;

    // Encrypt the accessToken before saving
    const encryptedToken = rest.credentials.accessToken
      ? /* your encrypt util */ rest.credentials.accessToken
      : "";

    const payload = {
      ...rest,
      credentials: {
        applicationId: rest.credentials.applicationId,
        accessToken:   encryptedToken,
      },
      createdAt: rest.createdAt || now,
      updatedAt: now,
    };

    await ref.set(payload, { merge: true });
  }
}
