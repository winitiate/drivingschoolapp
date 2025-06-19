/**
 * cancelAppointment.ts
 *
 * An alias for refundPayment, representing “cancel appointment”
 * in the UI.  
 *
 * Usage:
 *   import { cancelAppointment } from "../services/cancelAppointment";
 *   await cancelAppointment({
 *     toBeUsedBy:  "loc001",
 *     paymentId:   "PAY_789",
 *     amountCents: 2500,
 *     reason:      "Client cancelled",
 *   });
 */

import type {
  RefundPaymentInput,
  RefundPaymentResult
} from "./refundPayment";
import { refundPayment } from "./refundPayment";

export async function cancelAppointment(
  args: RefundPaymentInput
): Promise<RefundPaymentResult> {
  return refundPayment(args);
}
