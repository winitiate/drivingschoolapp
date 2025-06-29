/*  src/models/User.ts  */

import { BaseEntity } from "./BaseEntity";

/* ------------------------------------------------------------------ */
/*  Role enums                                                        */
/* ------------------------------------------------------------------ */
export type UserRole =
  | "superAdmin"
  | "businessOwner"
  | "locationAdmin"
  | "serviceProvider"
  | "client";

/* ------------------------------------------------------------------ */
/*  User model                                                        */
/* ------------------------------------------------------------------ */
/**
 * Canonical user profile document (1-to-1 with Firebase-Auth UID).
 * Inherits `createdAt`, `updatedAt`, `status` … from BaseEntity.
 */
export interface User extends BaseEntity {
  /* ── identity ──────────────────────────────────────────────────── */
  uid: string;                // Firebase-Auth UID
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  /* ── global roles (“capabilities”) ─────────────────────────────── */
  roles: UserRole[];

  /* ── ownership / membership lists ──────────────────────────────── */
  ownedBusinessIds:   string[];  // ↔ role “businessOwner”
  memberBusinessIds:  string[];

  ownedLocationIds:   string[];  // sub-site owners
  adminLocationIds:   string[];  // ↔ role “locationAdmin”
  providerLocationIds:string[];  // ↔ role “serviceProvider”
  clientLocationIds:  string[];  // ↔ role “client”

  /* ── life-cycle control (per relationship) ─────────────────────── */
  bannedProviderLocationIds?:      string[];
  deactivatedProviderLocationIds?: string[];

  bannedClientLocationIds?:        string[];
  deactivatedClientLocationIds?:   string[];

  bannedAdminLocationIds?:         string[];
  deactivatedAdminLocationIds?:    string[];

  bannedOwnedBusinessIds?:         string[];
  deactivatedOwnedBusinessIds?:    string[];

  /**
   * Sparse note map — keyed by locationId / businessId.
   * Only present when user is currently *banned* or *deactivated*.
   */
  lifecycleNotes?: {
    [locationOrBizId: string]: {
      type: "banned" | "deactivated";
      msg?: string;     // human-readable reason (optional)
      by:  string;      // actor UID
      at:  string;      // ISO-8601 timestamp
    };
  };

  /* ── optional fine-grain ACL _____________________________________ */
  permissions?: Record<string, string[]>;
}
