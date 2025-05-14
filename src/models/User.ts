// src/models/User.ts
import { BaseEntity } from './BaseEntity';

export interface User extends BaseEntity {
  /** Firebase Auth UID */
  uid: string;

  /** Core profile */
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  /** Coarse roles (can hold multiple) */
  roles: string[]; // e.g. ['student','instructor','schoolAdmin','superAdmin']

  /** Optional fine-grained per-school permissions */
  permissions?: Record<string, string[]>; // { [schoolId]: ['manageCourses','viewReports',…] }
}
