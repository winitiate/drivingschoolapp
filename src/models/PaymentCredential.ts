// src/models/PaymentCredential.ts

/**
 * PaymentCredential.ts
 *
 * The PaymentCredential model represents a set of payment-gateway credentials
 * stored in Firestore (encrypted at rest) and used in-memory (decrypted)
 * by your app.  
 *
 * Fields:
 * - id?           Firestore document ID
 * - provider      e.g. "square"
 * - ownerType     e.g. "serviceLocation"
 * - ownerId       ID of the entity that owns these creds
 * - toBeUsedBy    ID of the location that will actually use these creds
 * - credentials:  
 *     • applicationId  
 *     • accessToken (decrypted in-memory)
 * - createdAt? / updatedAt?  Firestore Timestamps
 */

import { Timestamp } from "firebase/firestore";

export interface PaymentCredential {
  id?: string;
  provider: string;
  ownerType: string;
  ownerId: string;
  toBeUsedBy: string;
  credentials: {
    applicationId: string;
    accessToken: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
