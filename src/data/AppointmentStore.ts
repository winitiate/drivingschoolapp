// src/data/AppointmentStore.ts

/**
 * AppointmentStore.ts
 *
 * Defines the abstraction interface for “appointments” — scheduled service interactions
 * between clients and service providers. All methods return Promises so implementations
 * can be swapped out (e.g. Firestore, REST API, in-memory mock) without changing calling code.
 */

import { Appointment } from "../models/Appointment";

export interface AppointmentStore {
  /**
   * Fetch a single appointment by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The Appointment object, or null if not found.
   */
  getById(id: string): Promise<Appointment | null>;

  /**
   * List *all* appointments in the system.
   * @returns  Array of Appointment objects.
   */
  listAll(): Promise<Appointment[]>;

  /**
   * List appointments associated with a specific client.
   * @param clientId  The ID of the client (end user).
   * @returns         Array of Appointment objects for that client.
   */
  listByClient(clientId: string): Promise<Appointment[]>;

  /**
   * List appointments associated with a specific service provider.
   * @param serviceProviderId  The ID of the service provider.
   * @returns                  Array of Appointment objects for that provider.
   */
  listByServiceProvider(serviceProviderId: string): Promise<Appointment[]>;

  /**
   * Create or update an appointment record.
   * If `appointment.id` is provided, merges/overwrites that document;
   * otherwise a new document is created.
   * @param appointment  The Appointment data to persist.
   */
  save(appointment: Appointment): Promise<void>;
}

