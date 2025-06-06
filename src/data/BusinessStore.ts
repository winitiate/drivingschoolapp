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

  /**
   * Fetch all businesses where the given UID is one of the owners.
   * Uses Firestore’s `array‐contains` on `ownerIds` under the hood.
   */
  queryByOwner(ownerUid: string): Promise<Business[]>;

  /**
   * Fetch all businesses where the given UID is a member (non-owning team member).
   * Uses Firestore’s `array‐contains` on `memberIds` under the hood.
   */
  queryByMember(memberUid: string): Promise<Business[]>;

  /** Create or update a business record (saves to Firestore) */
  save(business: Business): Promise<void>;
}
