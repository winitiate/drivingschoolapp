/**
 * appointment.ts
 *
 * Shared TypeScript interfaces for appointment creation, updates, and rescheduling.
 */

export interface CreateAppointmentInput {
  appointmentId:   string;              // Firestore doc ID
  appointmentData: Record<string, any>; // full object to write
}

export interface CreateAppointmentResult {
  success: boolean;
}

export interface UpdateAppointmentStatusInput {
  appointmentId: string;
  status:        string;
  metadata?:     Record<string, any>;
}

export interface UpdateAppointmentStatusResult {
  success: boolean;
}

/**
 * Rescheduling
 */
export interface RescheduleAppointmentInput {
  /** The ID of the existing appointment to reschedule */
  oldAppointmentId: string;
  /** The full new appointment data, including `id` */
  newAppointmentData: Record<string, any>;
}

export interface RescheduleAppointmentResult {
  /** True on successful completion */
  success: boolean;
  /** The ID of the newly created appointment */
  newAppointmentId: string;
}
