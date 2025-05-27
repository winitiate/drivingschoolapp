// src/models/GradingScale.ts

import { BaseEntity } from './BaseEntity';

/**
 * A set of ordered levels used to rate an AssessmentType.
 */
export interface GradingScale extends BaseEntity {
  /** which service location this scale belongs to */
  serviceLocationId: string;
  /** human-readable title, e.g. “0 to 6 Grading Scale” */
  title: string;
  /** e.g. [ { level: 0, description: 'Introduced' }, … ] */
  levels: Array<{ level: number; description: string }>;
}
