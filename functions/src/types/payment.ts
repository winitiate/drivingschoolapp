/**
 * payment.ts
 *
 * Shared TypeScript interfaces for payment/refund flows.
 */
export interface CreatePaymentInput {
  toBeUsedBy:     string;           // used to look up Square creds
  nonce:          string;           // Square card nonce/token
  amountCents:    number;           // amount to charge, in cents
  idempotencyKey?: string;          // optional; auto-generated if missing
}

export interface CreatePaymentResult {
  paymentId: string;
  status:    "COMPLETED" | "PENDING";
}

export interface RefundPaymentInput {
  toBeUsedBy:     string;           // used to look up Square creds
  paymentId:      string;           // Square payment ID to refund
  amountCents:    number;           // amount to refund, in cents
  reason?:        string;           // optional description
  idempotencyKey?: string;          // optional; auto-generated if missing
}

export interface RefundPaymentResult {
  refundId: string;
  status:   "COMPLETED" | "PENDING" | "FAILED";
}
