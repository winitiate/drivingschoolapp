// src/models/ServiceLocation.ts

import { BaseEntity } from './BaseEntity';
import { AppointmentType } from './AppointmentType';

/**
 * A place (physical or virtual) where services occur.
 */
export interface ServiceLocation extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;

  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  address?: {
    street: string;
    city: string;
    province?: string;
    postalCode: string;
  };
  geo?: { lat: number; lng: number };

  businessHours?: Partial<
    Record<
      'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
      { open: string; close: string }
    >
  >;

  websiteUrl?: string;
  about?: string;
  policy?: string;

  faqIds?: string[];
  serviceProviderIds?: string[];
  clientIds?: string[];

  // ────────────────────────────────────────────────────────────────────────
  // New override settings:

  /** If true, this location can define its own Appointment Types */
  allowAppointmentTypeOverride?: boolean;
  /** Only used when allowAppointmentTypeOverride==true */
  locationAppointmentTypes?: AppointmentType[];

  /** If true, this location can set its own booking window */
  allowNoticeWindowOverride?: boolean;
  /** No bookings less than this many hours from now */
  minNoticeHours?: number;
  /** No bookings more than this many days ahead */
  maxAdvanceDays?: number;

  customFields?: Record<string, any>;
}
