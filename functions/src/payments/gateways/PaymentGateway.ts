/**
 * A small interface so you can swap in StripeGateway, PayPalGateway, etc.
 */

export interface CreatePaymentInput {
  ownerType: "serviceLocation" | "business" | "serviceProvider";
  ownerId: string;             // to fetch the encrypted credential
  appointmentTypeId: string;   // for bookkeeping/notes
  amountCents: number;
  nonce: string;               // card token from Web Payments SDK
  idempotencyKey: string;      // client-generated UUID
}

export interface PaymentGateway {
  createPayment(input: CreatePaymentInput): Promise<{
    paymentId: string;
    status: "COMPLETED" | "PENDING";
  }>;
}
