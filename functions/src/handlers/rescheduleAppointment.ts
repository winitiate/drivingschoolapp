/**
 * rescheduleAppointment.ts – Callable handler
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { rescheduleAppointmentService } from "../services/rescheduleAppointmentService";
import type {
  RescheduleAppointmentInput,
  RescheduleAppointmentResult,
} from "../types/appointment";

/* Pure handler (easier to unit-test) */
export async function rescheduleAppointmentHandler(
  req: { data: RescheduleAppointmentInput }
): Promise<RescheduleAppointmentResult> {
  try {
    return await rescheduleAppointmentService(req.data);
  } catch (e: any) {
    if (e instanceof HttpsError) throw e;
    console.error("rescheduleAppointment error:", e);
    throw new HttpsError("internal", e.message || "Reschedule failed");
  }
}

/* Callable export */
export const rescheduleAppointment = onCall(
  { memory: "128MiB", timeoutSeconds: 30 },
  rescheduleAppointmentHandler
);
