// src/data/SubscriptionPackageStore.ts

import type { SubscriptionPackage } from "../models/SubscriptionPackage";

/**
 * SubscriptionPackageStore
 *
 * Abstraction/interface for reading/writing "subscriptionPackages".
 * Methods return Promises so implementations can be swapped.
 */
export interface SubscriptionPackageStore {
  /** Fetch a single package by its document ID. Returns null if not found. */
  getById(id: string): Promise<SubscriptionPackage | null>;

  /** List all subscription packages in the system (unordered). */
  listAll(): Promise<SubscriptionPackage[]>;

  /** List only the “active” subscription packages, in display order. */
  listAllActive(): Promise<SubscriptionPackage[]>;

  /** Create or update a package record. */
  save(pkg: SubscriptionPackage): Promise<void>;

  /** Delete a package by ID. */
  delete(id: string): Promise<void>;
}
