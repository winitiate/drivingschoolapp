import { Business } from '../models/Business';

/**
 * BusinessStore.ts
 *
 * Abstraction interface for “businesses” (tenants).
 * All methods return Promises so implementations can
 * be swapped out without changing calling code.
 */
export interface BusinessStore {
  /** Fetch a single business by its document ID */
  getById(id: string): Promise<Business | null>;

  /** List all businesses in the system */
  listAll(): Promise<Business[]>;

  /** Create or update a business record */
  save(business: Business): Promise<void>;
}
