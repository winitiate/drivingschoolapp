// src/data/ServiceProviderStore.ts

/**
 * ServiceProviderStore.ts
 *
 * Defines the abstraction interface for “serviceProviders” (formerly “instructors”):
 * any professional offering services. All methods return Promises so implementations
 * can be swapped out (e.g. Firestore, REST API, in-memory mock) without changing
 * calling code.
 */

import { ServiceProvider } from "../models/ServiceProvider";

export interface ServiceProviderStore {
  /**
   * Fetch a single service provider by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The ServiceProvider object, or null if not found
   */
  getById(id: string): Promise<ServiceProvider | null>;

  /**
   * Find a provider by their license or registration number.
   * @param licenseNumber  A unique external identifier on the ServiceProvider model
   * @returns              The ServiceProvider object, or null if none matches
   */
  findByLicense(licenseNumber: string): Promise<ServiceProvider | null>;

  /**
   * Create or update a service provider record.
   * If `provider.id` exists, merges/overwrites that document;
   * otherwise a new document is created.
   * @param provider  The ServiceProvider data to persist
   */
  save(provider: ServiceProvider): Promise<void>;

  /**
   * List every service provider in the system across all locations.
   * @returns  Array of all ServiceProvider objects
   */
  listAll(): Promise<ServiceProvider[]>;

  /**
   * List providers associated with a specific service location.
   * @param serviceLocationId  The ID of the location/facility to filter by
   * @returns                  Array of ServiceProvider objects linked to that location
   */
  listByServiceLocation(serviceLocationId: string): Promise<ServiceProvider[]>;
}

