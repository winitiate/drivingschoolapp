/**
 * cancelAppointment.ts  —  v3 Callable Cloud Function
 * ---------------------------------------------------------------------------
 *  • Validates payload **including an optional `reason` string**.
 *  • Delegates to `cancelAppointmentService` which:
 *        – issues the refund / cancellation-fee charge
 *        – writes the updated appointment (incl. `cancellation.reason`)
 *        – returns the full `CancelAppointmentResult`
 *  • Wraps any error in an `HttpsError` so the client sees a friendly message.
 *
 * NOTE:  This file **must** be re-exported once (and only once) from index.ts.
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import {
  cancelAppointmentService,
  CancelAppointmentInput,
  CancelAppointmentResult,
} from "../services/cancelAppointmentService";

/* ------------------------------------------------------------------ */
/*  Callable                                                            */
/* ------------------------------------------------------------------ */
export const cancelAppointment = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<CancelAppointmentInput>
  ): Promise<CancelAppointmentResult> => {
    const data = req.data;

    /* -------------------------------------------------- */
    /*  Basic validation                                  */
    /* -------------------------------------------------- */
    if (!data?.appointmentId) {
      throw new HttpsError("invalid-argument", "Missing appointmentId");
    }

    if (data.reason != null && typeof data.reason !== "string") {
      throw new HttpsError("invalid-argument", "`reason` must be a string");
    }

    // Trim reason here so the service doesn’t have to repeat it.
    if (typeof data.reason === "string") {
      data.reason = data.reason.trim();
    }

    /* -------------------------------------------------- */
    /*  Delegate to domain service                        */
    /* -------------------------------------------------- */
    try {
      return await cancelAppointmentService(data);
    } catch (err: unknown) {
      console.error("cancelAppointment error:", err);

      const code =
        typeof (err as any)?.status === "string"
          ? (err as any).status
          : "internal";

      const msg =
        (err as any)?.message ??
        "An unexpected error occurred while cancelling the appointment.";

      throw new HttpsError(code as any, msg);
    }
  }
);
