import { onCall, HttpsError }                 from "firebase-functions/v2/https";
import { rescheduleAppointmentService }       from "../services/rescheduleService";
import { RescheduleAppointmentInput, RescheduleAppointmentResult } from "../types/appointment";

/**
 * Pure handler for unit tests.
 */
export async function rescheduleAppointmentHandler(
  req: { data: RescheduleAppointmentInput }
): Promise<RescheduleAppointmentResult> {
  try {
    return await rescheduleAppointmentService(req.data);
  } catch (e: any) {
    // Propagate HttpsError
    if (e instanceof HttpsError) throw e;
    console.error("rescheduleAppointment → unexpected error:", e);
    throw new HttpsError("internal", `Reschedule failed: ${e.message}`);
  }
}

/**
 * Production export
 */
export const rescheduleAppointment = onCall(
  { memory: "128MiB", timeoutSeconds: 30 },
  rescheduleAppointmentHandler
);
