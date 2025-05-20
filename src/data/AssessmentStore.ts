// src/data/AssessmentStore.ts

/**
 * AssessmentStore.ts
 *
 * Defines the abstraction interface for “assessments” — evaluations tied to
 * specific appointments. All methods return Promises so implementations can
 * be swapped out (e.g., Firestore, REST API, in-memory mock) without changing
 * calling code.
 */

import { Assessment } from "../models/Assessment";

export interface AssessmentStore {
  /**
   * Fetch a single assessment by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The Assessment object, or null if not found
   */
  getById(id: string): Promise<Assessment | null>;

  /**
   * List *all* assessments in the system.
   * @returns  Array of Assessment objects
   */
  listAll(): Promise<Assessment[]>;

  /**
   * List assessments tied to a specific appointment.
   * @param appointmentId  The ID of the appointment to filter by
   * @returns              Array of Assessment objects for that appointment
   */
  listByAppointment(appointmentId: string): Promise<Assessment[]>;

  /**
   * List all assessments created for a given service provider.
   * @param serviceProviderId  The ID of the service provider
   */
  listByServiceProvider(serviceProviderId: string): Promise<Assessment[]>;

  /**
   * List all assessments created under a specific service location.
   * @param serviceLocationId  The ID of the service location
   */
  listByServiceLocation(serviceLocationId: string): Promise<Assessment[]>;

  /**
   * Create or update an assessment record.
   * If `assessment.id` is provided, merges/overwrites that document;
   * otherwise a new document is created.
   * @param assessment  The Assessment data to persist
   */
  save(assessment: Assessment): Promise<void>;
}
