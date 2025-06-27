// src/services/api/appointments/cancelAppointment.ts
/**
 * cancelAppointment.ts
 * --------------------------------------------------------------------------
 * Front-end wrapper for the **cancelAppointment** Cloud Function (v3).
 *
 * Typical usage:
 *
 *   await cancelAppointment({
 *     appointmentId:          "appt-123",
 *     cancellationFeeCents:   500,            // optional – dry-run
 *     acceptCancellationFee:  true,           // optional – 2nd call
 *     reason:                 "Client sick",  // optional
 *   });
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase";

/* ------------------------------------------------------------------ */
/*  Payload & Result types (mirror the CF)                             */
/* ------------------------------------------------------------------ */

export interface CancelAppointmentInput {
  /** Firestore document ID of the appointment */
  appointmentId: string;

  /** Optional: fee suggested by the client (first, *dry-run* call) */
  cancellationFeeCents?: number;

  /**
   * Optional: only present on the *second* call when the user
   * explicitly accepts the server-suggested fee.
   */
  acceptCancellationFee?: boolean;

  /** Optional free-text reason (max ~1 KB enforced via Firestore rules) */
  reason?: string;
}

export interface CancelAppointmentResult {
  success: boolean;

  /**
   * If `true` the caller *must* show the fee to the user and call
   * `cancelAppointment` again with `acceptCancellationFee:true`.
   */
  requiresConfirmation?: boolean;

  /** Echo of the fee the server needs confirmed */
  cancellationFeeCents?: number;

  /**
   * Present when the function actually performed a refund /
   * partial refund.  Exact shape depends on your payment service.
   */
  refundResult?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Wrapper                                                            */
/* ------------------------------------------------------------------ */
export async function cancelAppointment(
  data: CancelAppointmentInput
): Promise<CancelAppointmentResult> {
  const fn = httpsCallable<
    CancelAppointmentInput,
    CancelAppointmentResult
  >(functions, "cancelAppointment");

  const res = await fn(data);
  return res.data;
}
