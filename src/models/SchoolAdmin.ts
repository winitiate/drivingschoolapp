// src/models/SchoolAdmin.ts
import { BaseEntity } from './BaseEntity';

export interface SchoolAdmin extends BaseEntity {
  /** Link back to users/{uid} */
  userId: string;

  /** The school this admin manages */
  schoolId: string;

  /** Optional granular permissions within that school */
  permissions?: string[];
}
