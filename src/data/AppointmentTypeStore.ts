// src/data/AppointmentTypeStore.ts

/**
 * AppointmentTypeStore.ts
 *
 * Defines the abstraction interface for “appointmentTypes” (formerly “appointmentTypes”):
 * discrete categories of appointments offered at a service location.
 * All methods return Promises so that implementations can be swapped out
 * (e.g. Firestore, REST API, in-memory mock) without changing calling code.
 */

import { AppointmentType } from "../models/AppointmentType";

export interface AppointmentTypeStore {
  /**
   * List every appointment type in the system.
   * @returns Array of AppointmentType objects
   */
  listAll(): Promise<AppointmentType[]>;

  /**
   * List appointment types offered at a specific service location.
   * @param serviceLocationId  ID of the location or facility
   * @returns                  Array of AppointmentType objects for that location
   */
  listByServiceLocation(serviceLocationId: string): Promise<AppointmentType[]>;

  /**
   * Create or update an appointment type record.
   * If `appointmentType.id` exists, that document is merged/overwritten;
   * otherwise a new document is created.
   * @param appointmentType  The AppointmentType data to persist
   */
  save(appointmentType: AppointmentType): Promise<void>;
}

