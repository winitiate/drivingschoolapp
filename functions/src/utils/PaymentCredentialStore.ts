// functions/src/utils/PaymentCredentialStore.ts

/**
 * PaymentCredentialStore.ts
 *
 * Defines how to load/save Square (and future) credentials.
 */

import { Timestamp } from "firebase-admin/firestore";

export interface PaymentCredential {
  id?: string;
  provider:    string;
  ownerType:   string;
  ownerId:     string;
  toBeUsedBy:  string;
  credentials: {
    applicationId: string;
    accessToken:   string;
  };
  createdAt?:  Timestamp;
  updatedAt?:  Timestamp;
}

export interface PaymentCredentialStore {
  /**
   * Load the single credential by `toBeUsedBy` tag only
   * (for cases like createPayment where we only care who uses them).
   */
  getByConsumer(provider: string, toBeUsedBy: string): Promise<PaymentCredential | null>;

  /**
   * Upsert the given credential document.
   * (Not used by createPayment, but part of the interface.)
   */
  save(credential: PaymentCredential): Promise<void>;
}
