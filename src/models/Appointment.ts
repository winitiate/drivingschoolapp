// src/models/Appointment.ts

import { BaseEntity } from './BaseEntity';

export interface Appointment extends BaseEntity {
  clientId: string;
  serviceProviderId: string;
  lessonTypeId: string;
  serviceLocationId: string;

  startTime: Date;
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

  /** any extra per-business fields */
  customFields?: Record<string, any>;
}
