/**
 * refundPayment.ts
 *
 * Front-end wrapper for the "refundPayment" Callable.
 *
 * Usage:
 *   import { refundPayment } from "../services/refundPayment";
 *   const result = await refundPayment({
 *     toBeUsedBy:  "loc001",
 *     paymentId:   "PAY_789",
 *     amountCents: 2500,
 *     reason:      "Client requested refund",
 *   });
 *
 * Returns:
 *   { refundId: string, status: "PENDING" | "COMPLETED" | "FAILED" }
 */

import { httpsCallable } from "firebase/functions";
import { functions }     from "../firebase";
import type {
  RefundPaymentInput,
  RefundPaymentResult
} from "../types/payment";

export async function refundPayment(
  data: RefundPaymentInput
): Promise<RefundPaymentResult> {
  const fn = httpsCallable<typeof data, RefundPaymentResult>(
    functions,
    "refundPayment"
  );
  const res = await fn(data);
  return res.data;
}
