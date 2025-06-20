/**
 * payment.ts  —  Shared interfaces for gateway charges & refunds.
 * Back-end services and front-end wrappers import from here.
 */

/* Gateway → Firestore “payments” write */
export interface CreatePaymentInput {
  toBeUsedBy:     string;   // serviceLocationId for Square creds lookup
  nonce:          string;   // Square card nonce
  amountCents:    number;   // in cents
  idempotencyKey?: string;
}
export interface CreatePaymentResult {
  paymentId: string;        // gateway charge ID
  status:    "COMPLETED" | "PENDING";
}

/* Refund a charge */
export interface RefundPaymentInput {
  toBeUsedBy:   string;     // serviceLocationId
  paymentId:    string;     // gateway charge ID
  amountCents:  number;     // refund amount (cents)
  reason?:      string;
  idempotencyKey?: string;
}
export interface RefundPaymentResult {
  refundId: string;         // gateway refund ID
  status:   "COMPLETED" | "PENDING" | "FAILED";
}

/* Firestore Payment doc (minimal compile-time helper) */
export interface PaymentDoc {
  transactionId:        string;
  amountCents:          number;
  currency:             string;
  paymentStatus:        "paid" | "pending" | "failed" | "refunded";
  appointmentId:        string | null;
  appointmentIds:       string[];
  balanceCents?:        number;
  refundId?:            string;
  refundStatus?:        "pending" | "failed" | "refunded";
  refundAmountCents?:   number;
  refundedAt?:          Date;
  cancellationFeeCents?: number;
  rescheduledFromApptId?: string | null;
  rescheduledToApptId?:   string | null;
}
