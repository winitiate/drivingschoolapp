/**
 * appointment.ts
 *
 * Shared TypeScript interfaces for appointment creation & updates.
 */

export interface CreateAppointmentInput {
  appointmentId:   string;             // Firestore doc ID
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
