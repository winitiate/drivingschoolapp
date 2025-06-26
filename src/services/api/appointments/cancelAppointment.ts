/**
 * cancelAppointment.ts
 * --------------------------------------------------------------------------
 * Front-end wrapper for the Cloud Function **cancelAppointment**.
 *
 * Typical call:
 *   import { cancelAppointment } from "../../services";
 *
 *   await cancelAppointment({
 *     appointmentId: "123",
 *     paymentId:     "sq0idp-…",   // optional
 *     amountCents:   5000,         // optional
 *     reason:        "Client sick",
 *     acceptCancellationFee: true, // optional
 *   });
 */

import { httpsCallable } from "firebase/functions";
// ✅ Correct relative path to src/firebase.ts
import { functions } from "../../../firebase";

/* ------------------------------------------------------------------ */
/*  Payload & Result types                                            */
/* ------------------------------------------------------------------ */
export interface CancelAppointmentInput {
  appointmentId: string;
  /** If appointment had a payment, include paymentId & amountCents */
  paymentId?: string;
  amountCents?: number;
  /** Human-readable reason for logs */
  reason?: string;
  /** Used when the CF requires fee acceptance on second call */
  acceptCancellationFee?: boolean;
}

export interface CancelAppointmentResult {
  success: boolean;
  refundIssued?: boolean;
  cancellationFeeCents?: number;
  requiresConfirmation?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Wrapper                                                            */
/* ------------------------------------------------------------------ */
export async function cancelAppointment(
  data: CancelAppointmentInput
): Promise<CancelAppointmentResult> {
  const fn = httpsCallable<CancelAppointmentInput, CancelAppointmentResult>(
    functions,
    "cancelAppointment"
  );

  const res = await fn(data);
  return res.data;
}
