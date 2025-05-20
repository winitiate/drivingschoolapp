// src/models/User.ts

import { BaseEntity } from './BaseEntity';

/**
 * Central auth/profile record (Firebase Auth UID ties to this).
 */
export interface User extends BaseEntity {
  /** Firebase Auth UID */
  uid: string;

  /** Core profile */
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  /** Coarse roles (e.g. client, provider, admin) */
  roles: string[];

  /**
   * Optional fine-grained per-location permissions.
   * { [serviceLocationId]: ['manageAppointments', 'viewReports', …] }
   */
  permissions?: Record<string, string[]>;
}
