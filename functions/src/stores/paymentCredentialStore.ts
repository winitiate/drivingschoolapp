/**
 * paymentCredentialStore.ts
 *
 * Firestore-based loader for your encrypted Square credentials:
 * - Queries paymentCredentials by provider + toBeUsedBy
 * - Decrypts AES-encrypted accessToken
 * - Returns a fully formed PaymentCredential or null
 */
import * as admin from "firebase-admin";
import { decrypt } from "../utils/encryption";

// Initialize Admin SDK exactly once
if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const COLLECTION = "paymentCredentials";

export interface PaymentCredential {
  id:           string;
  provider:     string;
  ownerType:    string;
  ownerId:      string;
  toBeUsedBy:   string;
  credentials: {
    applicationId: string;
    accessToken:   string;
  };
}

export class PaymentCredentialStore {
  async getByConsumer(
    provider: string,
    toBeUsedBy: string
  ): Promise<PaymentCredential | null> {
    const snap = await db
      .collection(COLLECTION)
      .where("provider", "==", provider)
      .where("toBeUsedBy", "==", toBeUsedBy)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const data = doc.data() as any;

    const applicationId = data.credentials.applicationId as string;
    const encryptedToken = data.credentials.accessToken as string;
    const accessToken = encryptedToken ? decrypt(encryptedToken) : "";

    return {
      id: doc.id,
      provider: data.provider,
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      toBeUsedBy: data.toBeUsedBy,
      credentials: { applicationId, accessToken },
    };
  }
}
