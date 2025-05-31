/**
 * Generic gateway interface so you can swap in Stripe, PayPal, etc.
 */

export interface CreatePaymentInput {
  ownerType: "serviceLocation" | "business" | "serviceProvider";
  ownerId: string;             // to fetch the encrypted credential
  appointmentTypeId: string;   // for bookkeeping/notes
  amountCents: number;
  nonce: string;               // card token from Web Payments SDK
  idempotencyKey: string;      // client-generated UUID
}

export interface RefundPaymentInput {
  ownerType: "serviceLocation" | "business" | "serviceProvider";
  ownerId: string;             // same credential lookup
  paymentId: string;           // Square payment to refund
  reason?: string;
}

export interface PaymentGateway {
  /* ───── charges ───── */
  createPayment(input: CreatePaymentInput): Promise<{
    paymentId: string;
    status: "COMPLETED" | "PENDING";
  }>;

  /* ───── full-amount refunds ───── */
  refundPayment(input: RefundPaymentInput): Promise<{
    refundId: string;
    status: "COMPLETED" | "PENDING" | "FAILED";
  }>;
}
