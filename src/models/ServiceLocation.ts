// src/models/ServiceLocation.ts

import { BaseEntity } from './BaseEntity';

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

  customFields?: Record<string, any>;
}
