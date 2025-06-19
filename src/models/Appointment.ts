// src\models\Appointment.ts
import { BaseEntity } from "./BaseEntity";
import { Timestamp } from "firebase/firestore";

/**
 * An Appointment may now have an optional `cancellation` block,
 * instead of being deleted outright.
 */
export interface Appointment extends BaseEntity {
  clientIds: string[];                 // supports group appointments
  serviceProviderIds: string[];        // supports co-instructors or multiple providers
  appointmentTypeId: string;           // more generic than lessonTypeId
  serviceLocationId: string;

  startTime: Date;
  endTime: Date;
  durationMinutes: number;

  status: "scheduled" | "booked" | "completed" | "cancelled" | "no-show";

  /**
   * If the appointment was cancelled (soft‐cancel), this object is set.
   * FirestoreAppointmentStore.toFirestore will convert its `time: Date`
   * into a Firestore Timestamp automatically.
   */
  cancellation?: {
    time: Date;
    reason: string;
    feeApplied: boolean;
  };

  assessmentId?: string;

  /**
   * We moved `paymentId` from inside `metadata` to a top‐level field,
   * so we can always reference `appt.paymentId` when refunding.
   */
  paymentId?: string;

  notes: string;
  locationOverride?: string;

  customFields?: Record<string, any>;

  // whoever scheduled/edited this appointment
  metadata?: {
    createdBy?: string;
    updatedBy?: string;
    source?: "web" | "mobile" | "admin";
  };
}
