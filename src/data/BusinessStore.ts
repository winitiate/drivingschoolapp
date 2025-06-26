/**
 * BusinessStore.ts
 *
 * Abstraction interface for the “businesses” collection.
 * Method signatures unchanged — the new selfRegister object lives
 * inside the Business model itself.
 */

import { Business } from "../models/Business";

export interface BusinessStore {
  /** Fetch a single business by its document ID */
  getById(id: string): Promise<Business | null>;

  /** List all businesses in the system */
  listAll(): Promise<Business[]>;

  /** Create or update a business record */
  save(business: Business): Promise<void>;
}
