// src/data/PackageStore.ts

/**
 * PackageStore.ts
 *
 * Defines the abstraction interface for “packages” — bundled offerings
 * or products in the system. All methods return Promises so implementations
 * can be swapped out (e.g. Firestore, REST API, in-memory mock) without
 * changing calling code.
 */

import { Package } from "../models/Package";

export interface PackageStore {
  /**
   * Fetch a single package by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The Package object, or null if not found
   */
  getById(id: string): Promise<Package | null>;

  /**
   * List *all* packages in the system.
   * @returns  Array of Package objects
   */
  listAll(): Promise<Package[]>;

  /**
   * Create or update a package record.
   * If `pkg.id` is provided, merges/overwrites that document;
   * otherwise a new document is created.
   * @param pkg  The Package data to persist
   */
  save(pkg: Package): Promise<void>;
}

