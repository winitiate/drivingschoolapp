// functions/src/payments/gateways/PaymentGateway.ts

/**
 * Shared type declarations for createPayment/refundPayment.
 */

export interface CreatePaymentInput {
  ownerType: string;
  ownerId: string;
  idempotencyKey: string;
  nonce: string;
  amountCents: number;
  appointmentTypeId: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  status: "COMPLETED" | "PENDING";
}

export interface RefundPaymentInput {
  ownerType: string;
  ownerId: string;
  paymentId: string;
  amountCents: number;
  reason?: string;
}

export interface RefundPaymentResult {
  refundId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

export interface PaymentGateway {
  createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult>;

  refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentResult>;
}
