// src/models/School.ts
import { BaseEntity } from './BaseEntity';

export interface School extends BaseEntity {
  name: string;
  email: string;
  phone: string;

  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };

  geo: { lat: number; lng: number };
  businessHours: Partial<
    Record<
      'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
      { open: string; close: string }
    >
  >;

  websiteUrl: string;
  logoUrl: string;
  about: string;
  policy: string;

  faqIds: string[];
  instructorIds: string[];
  studentIds: string[];
}
