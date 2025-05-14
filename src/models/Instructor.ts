// src/models/Instructor.ts
import { BaseEntity } from './BaseEntity';

export interface Instructor extends BaseEntity {
  /** Link back to users/{uid} */
  userId: string;

  licenceNumber: string;
  licenceClass: string;

  address: {
    street: string;
    city: string;
    postalCode: string;
  };

  photoUrl: string;
  bio: string;
  languagesSpoken: string[];

  backgroundCheck: {
    date: Date;
    status: 'pending' | 'approved' | 'expired';
  };

  rating: {
    average: number;
    reviewCount: number;
  };

  availability: Array<{ dayOfWeek: number; start: string; end: string }>;
  blockedTimes: Date[];
  vehiclesCertifiedFor: string[];
}
