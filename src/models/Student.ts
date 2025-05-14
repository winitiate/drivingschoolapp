// src/models/Student.ts
import { BaseEntity } from './BaseEntity';

export interface Student extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

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
  banReason: string;

  firebaseAuthUid: string;
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