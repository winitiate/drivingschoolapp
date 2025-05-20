// src/data/ClientStore.ts

/**
 * ClientStore.ts
 *
 * Defines the abstraction interface for “clients” (formerly “students”)
 * across any type of service business. A “client” here is the end recipient
 * of services (e.g. a student, customer, patient, etc.).
 *
 * All methods return Promises so implementations can be swapped out
 * (e.g. REST API, local mock, Firestore) without changing calling code.
 */

import { Client } from "../models/Client";

export interface ClientStore {
  /**
   * Fetch a single client by their Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The Client object, or null if not found
   */
  getById(id: string): Promise<Client | null>;

  /**
   * Find a client by their license or membership number.
   * @param licenseNumber  A unique external identifier on the Client model
   * @returns              The Client object, or null if none matches
   */
  findByLicense(licenseNumber: string): Promise<Client | null>;

  /**
   * Create or update a client record.
   * If the provided Client has an `id`, that document is merged/overwritten.
   * Otherwise a new document is created and its ID set on the returned object.
   * @param client  The Client data to persist
   */
  save(client: Client): Promise<void>;

  /**
   * List every client across all service locations.
   * @returns  Array of all Clients in the system
   */
  listAll(): Promise<Client[]>;

  /**
   * List only those clients associated with the given serviceLocation.
   * @param serviceLocationId  The ID of the location/facility to filter by
   * @returns                  Array of Clients linked to that location
   */
  listByServiceLocation(serviceLocationId: string): Promise<Client[]>;
}

