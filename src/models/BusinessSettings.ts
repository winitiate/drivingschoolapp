// src/models/BusinessSettings.ts

import { BaseEntity } from "./BaseEntity";

/**
 * Global settings for a business tenant.
 */
export interface BusinessSettings extends BaseEntity {
  businessId: string;

  // ▶ Appointment‐type defaults for all locations
  appointmentTypes: {
    id: string;               // matches AppointmentType.id
    title: string;
    description?: string;
    durationMinutes: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    price?: number;
    order?: number;
    customFields?: Record<string, any>;
  }[];

  // ▶ Advance‐booking window
  minNoticeHours: number;     // no bookings < this many hours ahead
  maxAdvanceDays: number;     // no bookings > this many days ahead

  // ▶ Cancellation/reschedule policy
  cancellationPolicy: {
    allowClientCancel: boolean;
    cancelDeadlineHours: number;
    feeOnLateCancel: number;   // flat fee or percentage
  };
  allowClientReschedule: boolean;
  rescheduleDeadlineHours: number;
}
