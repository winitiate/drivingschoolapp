/**
 * cancelAppointment.ts  —  v2 Callable Cloud Function
 *
 *  • Validates payload
 *  • Delegates to cancelAppointmentService (refund + Firestore update)
 *  • Wraps errors in HttpsError so the client sees a friendly message
 *
 * NOTE: Must be exported once (and only once) in index.ts.
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import {
  cancelAppointmentService,
  CancelAppointmentInput,
  CancelAppointmentResult,
} from "../services/cancelAppointmentService";

export const cancelAppointment = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<CancelAppointmentInput>
  ): Promise<CancelAppointmentResult> => {
    const data = req.data;

    if (!data?.appointmentId) {
      throw new HttpsError("invalid-argument", "Missing appointmentId");
    }

    try {
      return await cancelAppointmentService(data);
    } catch (err: any) {
      console.error("cancelAppointment error:", err);
      const code =
        typeof err.status === "string" ? err.status : "internal";
      throw new HttpsError(code as any, err.message || "internal");
    }
  }
);
