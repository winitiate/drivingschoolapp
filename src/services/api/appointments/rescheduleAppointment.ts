// src/services/api/appointments/rescheduleAppointment.ts
// ────────────────────────────────────────────────────────────
// Wrapper around the Cloud Function  `rescheduleAppointment`
// ────────────────────────────────────────────────────────────

import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase";   // ← fixed relative path

/* Local types
   ─────────────────────────────────────────────── */
export interface RescheduleAppointmentInput {
  appointmentId: string;
  newStart: string;   // ISO-8601 timestamp
  newEnd:   string;   // ISO-8601 timestamp
  reason?:  string;
}

/** Adjust once you know the exact shape returned by the Cloud Function */
export type RescheduleAppointmentResponse = unknown;

/* API call
   ─────────────────────────────────────────────── */
/**
 * Calls the Cloud Function `rescheduleAppointment` and returns the
 * updated appointment object produced by the back-end.
 */
export async function rescheduleAppointment(
  payload: RescheduleAppointmentInput
): Promise<RescheduleAppointmentResponse> {
  const call = httpsCallable<
    RescheduleAppointmentInput,
    RescheduleAppointmentResponse
  >(functions, "rescheduleAppointment");

  const { data } = await call(payload);
  return data;
}
