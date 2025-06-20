/**
 * rescheduleAppointment.ts
 *
 * Front-end wrapper for the Callable Cloud Function “rescheduleAppointment”.
 * Keeps all booking / cancel code untouched.
 */

import { httpsCallable } from "firebase/functions";
import { functions }     from "../firebase";  // ← your initialized SDK

export interface RescheduleAppointmentInput {
  oldAppointmentId: string;
  newAppointmentData: Record<string, any>; // must include id
}

export interface RescheduleAppointmentResult {
  success: boolean;
  newAppointmentId: string;
}

export function rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<RescheduleAppointmentResult> {
  return httpsCallable<
    RescheduleAppointmentInput,
    RescheduleAppointmentResult
  >(functions, "rescheduleAppointment")(input).then(r => r.data);
}
