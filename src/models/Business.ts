/**
 * Business.ts
 * --------------------------------------------------------------------------
 * Top-level tenant entity.  Now includes a self-registration policy object
 * so each business can independently allow / forbid specific roles from
 * creating their own accounts.
 */

import { BaseEntity } from "./BaseEntity";

/** Fine-grained switch for each role */
export interface SelfRegisterSettings {
  /** Can a new Super / Business Owner self-register?  (usually false) */
  owner?: boolean;
  /** Can an external person self-register as Location Admin? */
  locationAdmin?: boolean;
  /** Can a provider (instructor, doctor, stylist…) self-register? */
  provider?: boolean;
  /** Can an end-user / client self-register? */
  client?: boolean;
}

/**
 * Top-level business entity (owns locations).
 */
export interface Business extends BaseEntity {
  /* ─────────────────────────── Essentials ─────────────────────────── */
  name: string;
  email?: string;
  phone?: string;
  website?: string;

  /* ─────────────────────────── Address ────────────────────────────── */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  /* ─────────────────────── Ownership & Contact ────────────────────── */
  ownerId?: string;       // UID of the user who owns this business
  ownerName?: string;
  ownerEmail?: string;    // convenience copy of their email
  ownerPhone?: string;

  /* ───────────────────── Business Classification ──────────────────── */
  businessType?: string;  // e.g. Retail, Service, Education
  industry?: string;

  /* ───────────────────── Operational Status ───────────────────────── */
  status?: "active" | "pending" | "suspended" | "closed";

  /* ────────────────── Registration & Compliance ───────────────────── */
  taxId?: string;
  registrationDate?: Date;

  /* ─────────────────────── Localization ───────────────────────────── */
  timezone?: string;
  defaultLanguage?: string;

  /* ─────────────────── Branding & White-labeling ──────────────────── */
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  /* ─────────────── NEW  •  Self-registration policy ───────────────── */
  /**
   * Per-role switches controlling who may self-register into this
   * business.  Undefined → inherit platform default (false).
   */
  selfRegister?: SelfRegisterSettings;

  /* ─────────────────────── Misc / Notes ───────────────────────────── */
  notes?: string;

  /** Arbitrary extension point */
  customFields?: Record<string, any>;
}
