/**
 * AppointmentTypeStore.ts
 *
 * Abstraction interface for “appointmentTypes”.
 * Allows Firestore, REST, or mock implementations to be swapped
 * without touching the calling code.
 */

import { AppointmentType } from "../models/AppointmentType";

export interface AppointmentTypeStore {
  /** Fetch a single AppointmentType by its document ID. */
  getById(id: string): Promise<AppointmentType | null>;

  /** List all appointment types in the system (admin only). */
  listAll(): Promise<AppointmentType[]>;

  /** List appointment types offered at one service-location. */
  listByServiceLocation(serviceLocationId: string): Promise<AppointmentType[]>;

  /**
   * Create / update an AppointmentType.
   * If `appointmentType.id` exists it is merged, otherwise inserted.
   */
  save(appointmentType: AppointmentType): Promise<void>;
}
