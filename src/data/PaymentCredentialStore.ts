// src/data/PaymentCredentialStore.ts

/**
 * PaymentCredentialStore.ts
 *
 * Defines how to persist and retrieve PaymentCredential records.
 *
 * Methods:
 * - getByOwner(provider, ownerType, ownerId)
 *     → loads the single record matching those three fields AND
 *       whose toBeUsedBy == ownerId.
 * - save(credential)
 *     → upserts (create or merge) the record.
 */

import { PaymentCredential } from "../models/PaymentCredential";

export interface PaymentCredentialStore {
  /**
   * Load the credential record for the given provider/ownerType/ownerId,
   * filtered so that toBeUsedBy == ownerId as well. Returns null if none.
   */
  getByOwner(
    provider: string,
    ownerType: string,
    ownerId: string
  ): Promise<PaymentCredential | null>;

  /**
   * Create or update the given credential. If credential.id exists,
   * merges into that doc; otherwise creates a new one.
   */
  save(credential: PaymentCredential): Promise<void>;
}
