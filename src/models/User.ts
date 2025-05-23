// src/models/User.ts

import { BaseEntity } from './BaseEntity';

export type UserRole =
  | 'superAdmin'
  | 'businessOwner'
  | 'locationAdmin'
  | 'serviceProvider'
  | 'client';

/**
 * Central auth/profile record (Firebase Auth UID ties to this).
 * Extends BaseEntity so we get createdAt/updatedAt/status/etc.
 */
export interface User extends BaseEntity {
  /** Firebase Auth UID */
  uid: string;

  /** Core profile */
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  /** Global capability roles */
  roles: UserRole[];

  /** 
   * Businesses they own (role includes 'businessOwner') 
   * or belong to as staff/admin.
   */
  ownedBusinessIds: string[];
  memberBusinessIds: string[];

  /** 
   * Service‐locations they own outright 
   * (e.g. subsite owners).
   */
  ownedLocationIds: string[];

  /** Service‐locations they administer (role includes 'locationAdmin') */
  adminLocationIds: string[];

  /** Service‐locations they deliver services at (role includes 'serviceProvider') */
  providerLocationIds: string[];

  /** Service‐locations where they are a client (role includes 'client') */
  clientLocationIds: string[];

  /** Per-location granular permissions, if you still need them */
  permissions?: Record<string, string[]>;
}
