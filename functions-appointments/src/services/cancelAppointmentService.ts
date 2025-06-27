// functions/src/services/cancelAppointmentService.ts

/**
 * cancelAppointmentService  — shared back-end logic
 *
 *  • Validates appointment status
 *  • Handles fee-confirmation handshake
 *  • Issues a Square (or Stripe) refund via paymentService.refundPayment
 *  • Persists a detailed `cancellation` object to the Appointment doc
 *  • Returns a rich result that ALWAYS contains the final Appointment
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { refundPayment } from "./paymentService";
import type { RefundPaymentResult } from "../types/payment";

/* ------------------------------------------------------------------ */
/*  Minimal shapes used internally                                    */
/* ------------------------------------------------------------------ */
interface Payment {
  transactionId: string;   // Square charge ID
  amount:        number;   // dollars
}

export interface CancelAppointmentInput {
  appointmentId:          string;
  cancellationFeeCents?:  number;
  acceptCancellationFee?: boolean;
  reason?:                string;   // ⭐ NEW
}

export interface CancelAppointmentResult {
  success:               boolean;
  requiresConfirmation?: boolean;
  cancellationFeeCents?: number;
  refundResult?:         RefundPaymentResult;
  /** Always included once `success === true` */
  appointment:           any;       // return the full Firestore data (typed as you wish)
}

/* ------------------------------------------------------------------ */
/*  Main service                                                      */
/* ------------------------------------------------------------------ */
export async function cancelAppointmentService(
  input: CancelAppointmentInput
): Promise<CancelAppointmentResult> {
  const db        = getFirestore();
  const reasonRaw = (input.reason ?? "").trim();          // may be ""

  /* ─── 1) Load the appointment ─────────────────────────────────── */
  const apptRef  = db.collection("appointments").doc(input.appointmentId);
  const apptSnap = await apptRef.get();

  if (!apptSnap.exists) {
    throw new HttpsError("not-found", "Appointment not found");
  }

  const appt = apptSnap.data()!;

  if (appt.status !== "scheduled") {
    throw new HttpsError(
      "failed-precondition",
      `Cannot cancel appointment with status "${appt.status}"`
    );
  }

  /* ─── 2) Load related payment, if any ─────────────────────────── */
  const paySnap = await db
    .collection("payments")
    .where("appointmentId", "==", input.appointmentId)
    .limit(1)
    .get();

  const payment: Payment | null = paySnap.empty
    ? null
    : (paySnap.docs[0].data() as Payment);

  /* ─── 3) Fee-confirmation handshake ───────────────────────────── */
  const feeCents = input.cancellationFeeCents ?? 0;

  if (feeCents > 0 && !input.acceptCancellationFee) {
    return {
      success: false,
      requiresConfirmation: true,
      cancellationFeeCents: feeCents,
      appointment: appt,          // return the current doc for convenience
    };
  }

  /* ─── 4) Refund via Square (if a charge exists) ───────────────── */
  let refundResult: RefundPaymentResult | undefined;

  if (payment?.transactionId && payment.amount > 0) {
    const paidCents   = Math.round(payment.amount * 100);
    const refundCents = Math.max(paidCents - feeCents, 0);

    try {
      refundResult = await refundPayment({
        toBeUsedBy:  appt.serviceLocationId,
        paymentId:   payment.transactionId,
        amountCents: refundCents,
        reason:      `Cancellation (${reasonRaw || "no reason provided"})`,
      });

      await db.collection("payments").doc(payment.transactionId).update({
        refundId:             refundResult.refundId,
        refundStatus:         refundResult.status === "FAILED" ? "failed" : "refunded",
        refundAmountCents:    refundCents,
        cancellationFeeCents: feeCents,
        refundedAt:           new Date(),
      });
    } catch (err: any) {
      console.error("Square refund error:", err);
      throw new HttpsError("internal", err.message || "Square refund failed");
    }
  }

  /* ─── 5) Persist the cancellation on the Appointment ─────────── */
  const cancellationObj = {
    time:       Timestamp.now(),
    reason:     reasonRaw,
    feeApplied: feeCents > 0,
  };

  await apptRef.update({
    status: "cancelled",
    cancellation: cancellationObj,
    // Retain / extend legacy metadata if you still need it
    metadata: {
      ...(appt.metadata ?? {}),
      cancelledAt:        new Date().toISOString(),
      cancellationFeeCents: feeCents,
      feeAccepted:        feeCents > 0,
      ...(refundResult ? { refundId: refundResult.refundId } : {}),
    },
  });

  /* ─── 6) Fetch the freshly written doc and return  ───────────── */
  const updatedSnap = await apptRef.get();
  const updated     = updatedSnap.data()!;

  return {
    success: true,
    cancellationFeeCents: feeCents,
    refundResult,
    appointment: updated,
  };
}
