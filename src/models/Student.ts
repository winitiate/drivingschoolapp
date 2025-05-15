// src/models/Student.ts
import { BaseEntity } from './BaseEntity';

/**
 * Student-specific data.
 * Auth/profile lives in users/{userId}.
 */
export interface Student extends BaseEntity {
  /** Link back to users/{uid} */
  userId: string;

  /** Which schools this student is enrolled in */
  schoolIds: string[];

  licenceNumber: string;
  licenceClass: string;

  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };

  learnerPermitExpiry: Date;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };

  roadTestAppointment: Date;
  banned: boolean;
  banReason?: string;

  progress: {
    totalLessons: number;
    skillsMastered: string[];
  };

  docs: {
    licenceCopyUrl: string;
    permitCopyUrl: string;
    other: string[];
  };
}
