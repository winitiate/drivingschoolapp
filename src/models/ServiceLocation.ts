/**
 * ServiceLocation.ts
 * --------------------------------------------------------------------------
 * Physical or virtual branch of a Business.
 * Adds `selfRegister` so each location can override its parent business’
 * default per-role registration policy.
 */

import { BaseEntity } from "./BaseEntity";
import { AppointmentType } from "./AppointmentType";

/* Re-use the same type declared in Business.ts */
import type { SelfRegisterSettings } from "./Business";

/**
 * A place (physical or virtual) where services occur.
 */
export interface ServiceLocation extends BaseEntity {
  /* ─────────────── Identity & Contact ─────────────── */
  name: string;
  email?: string;
  phone?: string;

  /* Links back to its parent business */
  businessId: string;

  /* ───────────── Branding & White-label ───────────── */
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  /* ─────────────────── Address ────────────────────── */
  address?: {
    street: string;
    city: string;
    province?: string;
    postalCode: string;
  };
  geo?: { lat: number; lng: number };

  /* ─────────── Operating Hours & Copy ─────────────── */
  businessHours?: Partial<
    Record<
      "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
      { open: string; close: string }
    >
  >;
  websiteUrl?: string;
  about?: string;
  policy?: string;

  /* ─────────────── Relations (IDs) ─────────────────── */
  faqIds?: string[];
  serviceProviderIds?: string[];
  clientIds?: string[];

  /* ────── Override Flags (appointment settings) ────── */
  allowAppointmentTypeOverride?: boolean;
  locationAppointmentTypes?: AppointmentType[];

  allowNoticeWindowOverride?: boolean;
  minNoticeHours?: number; // no bookings sooner than X hours
  maxAdvanceDays?: number; // no bookings further than Y days

  /* ───────────── NEW  •  Self-registration ─────────── */
  /**
   * Location-level overrides for self-registration.
   * If undefined, this location inherits its business’ default.
   */
  selfRegister?: SelfRegisterSettings;

  /* ───────────── Custom Fields (extensibility) ─────── */
  customFields?: Record<string, any>;
}
