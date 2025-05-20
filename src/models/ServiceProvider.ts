// src/models/User.ts

import { BaseEntity } from './BaseEntity';

/**
 * Auth/profile record; ties to Firebase Auth UID.
 */
export interface User extends BaseEntity {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  roles: string[];
  permissions?: Record<string, string[]>;

  customFields?: Record<string, any>;
}
