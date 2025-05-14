// src/models/Appointment.ts
export interface Appointment {
  /** BaseEntity fields */
  id?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;

  /** Appointment-specific fields */
  studentId: string;
  instructorId: string;
  lessonTypeId: string;
  schoolId: string;

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
}
