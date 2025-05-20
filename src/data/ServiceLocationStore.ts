// src/data/ServiceLocationStore.ts

/**
 * ServiceLocationStore.ts
 *
 * Defines the abstraction interface for “serviceLocations” (formerly “schools”):
 * physical or virtual places where services occur. All methods return Promises
 * so implementations can be swapped out (e.g., Firestore, REST API, in-memory mock)
 * without changing calling code.
 */

import { ServiceLocation } from "../models/ServiceLocation";

export interface ServiceLocationStore {
  /**
   * Fetch a single serviceLocation by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The ServiceLocation object, or null if not found
   */
  getById(id: string): Promise<ServiceLocation | null>;

  /**
   * Create or update a serviceLocation record.
   * If `location.id` exists, merges/overwrites that document;
   * otherwise a new document is created.
   * @param location  The ServiceLocation data to persist
   */
  save(location: ServiceLocation): Promise<void>;

  /**
   * List *all* serviceLocations in the system.
   * @returns  Array of ServiceLocation objects
   */
  listAll(): Promise<ServiceLocation[]>;

  /**
   * List serviceLocations owned by a specific user.
   * @param ownerId  The UID of the owner
   * @returns        Array of ServiceLocation objects owned by that user
   */
  listByOwner(ownerId: string): Promise<ServiceLocation[]>;
}

