// functions/src/services/cancelAppointmentService.ts

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError }   from "firebase-functions/v2/https";
import { refundPayment } from "./paymentService";
import type { RefundPaymentResult } from "../types/payment";

/** Minimal shape of the Payment doc as used by this service */
interface Payment {
  transactionId: string;   // Square charge ID
  amount: number;          // dollars
}

export interface CancelAppointmentInput {
  appointmentId: string;
  cancellationFeeCents?: number;
  acceptCancellationFee?: boolean;
}
export interface CancelAppointmentResult {
  success: boolean;
  requiresConfirmation?: boolean;
  cancellationFeeCents?: number;
  refundResult?: RefundPaymentResult;
}

export async function cancelAppointmentService(
  input: CancelAppointmentInput
): Promise<CancelAppointmentResult> {
  const db = getFirestore();

  /* ─ 1) Load appointment ───────────────────────────────────────── */
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

  /* ─ 2) Load payment doc ───────────────────────────────────────── */
  const paySnap = await db
    .collection("payments")
    .where("appointmentId", "==", input.appointmentId)
    .limit(1)
    .get();

  const payment: Payment | null = paySnap.empty
    ? null
    : (paySnap.docs[0].data() as Payment);

  /* ─ 3) Fee confirmation flow ─────────────────────────────────── */
  const feeCents = input.cancellationFeeCents ?? 0;
  if (feeCents > 0 && !input.acceptCancellationFee) {
    return {
      success: false,
      requiresConfirmation: true,
      cancellationFeeCents: feeCents,
    };
  }

  /* ─ 4) Refund via Square (if charge exists) ──────────────────── */
  let refundResult: RefundPaymentResult | undefined;
  if (payment?.transactionId && payment.amount > 0) {
    const paidCents   = Math.round(payment.amount * 100);
    const refundCents = Math.max(paidCents - feeCents, 0);

    refundResult = await refundPayment({
      toBeUsedBy:  appt.serviceLocationId,
      paymentId:   payment.transactionId,
      amountCents: refundCents,
      reason:      `Cancellation of ${input.appointmentId}`,
    });

    await db.collection("payments").doc(payment.transactionId).update({
      refundId:       refundResult.refundId,
      refundStatus:   refundResult.status === "FAILED" ? "failed" : "refunded",
      refundedAt:     new Date(),
    });
  }

  /* ─ 5) Mark appointment cancelled ────────────────────────────── */
  await apptRef.update({
    status: "cancelled",
    metadata: {
      cancelledAt: new Date().toISOString(),
      cancellationFeeCents: feeCents,
      feeAccepted: feeCents > 0,
      ...(refundResult ? { refundId: refundResult.refundId } : {}),
    },
  });

  return { success: true, cancellationFeeCents: feeCents, refundResult };
}
