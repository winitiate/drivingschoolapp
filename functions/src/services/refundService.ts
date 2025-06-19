/**
 * refundService.ts
 *
 * Core logic for refunding a payment via Square:
 * - Loads credentials from PaymentCredentialStore
 * - Instantiates Square client
 * - Calls paymentsApi.refundPayment()
 * - Returns only { refundId, status } or throws on error
 */
import { randomUUID } from "crypto";
import { getSquareClient } from "../clients/squareClient";
import { PaymentCredentialStore } from "../stores/paymentCredentialStore";
import { RefundPaymentInput, RefundPaymentResult } from "../types/payment";

export async function refund(
  input: RefundPaymentInput
): Promise<RefundPaymentResult> {
  // 1) Load Square credentials
  const store = new PaymentCredentialStore();
  const cred = await store.getByConsumer("square", input.toBeUsedBy);
  if (!cred) {
    throw new Error(`No Square credentials for toBeUsedBy="${input.toBeUsedBy}"`);
  }
  const { applicationId, accessToken } = cred.credentials;
  if (!applicationId || !accessToken) {
    throw new Error("Misconfigured credentials: missing applicationId or accessToken");
  }

  // 2) Instantiate Square client
  const client = getSquareClient(applicationId, accessToken);

  // 3) Build request
  const currency = applicationId.startsWith("sandbox-") ? "CAD" : "USD";
  const idempotencyKey = input.idempotencyKey || `refund-${input.paymentId}-${Date.now()}`;

  // 4) Call Square API
  const resp = await client.paymentsApi.refundPayment({
    idempotencyKey,
    paymentId:    input.paymentId,
    amountMoney:  { amount: BigInt(input.amountCents), currency },
  });

  const refundObj = resp.result.refund;
  if (!refundObj?.id || !refundObj?.status) {
    throw new Error("Square did not return refund details");
  }

  // 5) Return domain result
  return {
    refundId: refundObj.id,
    status:   refundObj.status as "PENDING" | "COMPLETED" | "FAILED",
  };
}
