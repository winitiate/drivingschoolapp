// src/data/GradingScaleStore.ts

/**
 * GradingScaleStore.ts
 *
 * Defines the abstraction interface for “gradingScales” — rating scales
 * for assessments, scoped per service location. All methods return Promises
 * so implementations can be swapped out (e.g. Firestore, REST API, in-memory mock)
 * without changing calling code.
 */

import { GradingScale } from "../models/GradingScale";

export interface GradingScaleStore {
  /**
   * List *all* grading scales in the system.
   * @returns Array of GradingScale objects
   */
  listAll(): Promise<GradingScale[]>;

  /**
   * List grading scales scoped to a specific service location.
   * @param serviceLocationId  The ID of the location/facility
   * @returns                   Array of GradingScale objects for that location
   */
  listByServiceLocation(serviceLocationId: string): Promise<GradingScale[]>;

  /**
   * Create or update a grading scale record.
   * If `gradingScale.id` is provided, merges/overwrites that document;
   * otherwise a new document is created.
   * @param gradingScale  The GradingScale data to persist
   */
  save(gradingScale: GradingScale): Promise<void>;
}

