// src/models/Appointment.ts

import { BaseEntity } from './BaseEntity';

export interface Appointment extends BaseEntity {
  clientIds: string[]; // supports group appointments
  serviceProviderIds: string[]; // supports co-instructors or multiple providers
  appointmentTypeId: string; // more generic than lessonTypeId
  serviceLocationId: string;

  startTime: Date;
  endTime: Date;
  durationMinutes: number;

  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';

  cancellation?: {
    time: Date;
    reason: string;
    feeApplied: boolean;
  };

  assessmentId?: string;
  paymentId?: string;

  notes: string;
  locationOverride?: string;

  customFields?: Record<string, any>;

  metadata?: {
    createdBy?: string;
    updatedBy?: string;
    source?: 'web' | 'mobile' | 'admin';
  };
}
