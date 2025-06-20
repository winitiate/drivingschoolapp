/**
 * paymentService.ts
 *
 * Talks only to Square’s server‐side SDK and returns the raw result.
 * Exports both `charge` and `refundPayment` for refund flows.
 */

import * as admin from "firebase-admin";
import { randomUUID } from "crypto";
import { PaymentCredentialStore } from "../stores/paymentCredentialStore";
import type { RefundPaymentInput, RefundPaymentResult } from "../types/payment";

export interface SquareChargeInput {
  toBeUsedBy:      string;
  amountCents:     number;
  idempotencyKey?: string;
  nonce:           string;
}
export interface SquareChargeResult {
  paymentId: string;
  status:    "COMPLETED" | "PENDING";
}

export async function charge(
  input: SquareChargeInput
): Promise<SquareChargeResult> {
  // 1️⃣ Look up & decrypt creds
  const store = new PaymentCredentialStore();
  const cred  = await store.getByConsumer("square", input.toBeUsedBy);
  if (!cred) {
    throw new Error(`No Square credentials for toBeUsedBy="${input.toBeUsedBy}"`);
  }
  const { applicationId, accessToken } = cred.credentials;
  if (!applicationId || !accessToken) {
    throw new Error("Misconfigured Square credentials");
  }

  // 2️⃣ Load Square SDK
  // @ts-ignore
  const { Client, Environment } = require("square/legacy");
  if (!Client || !Environment) {
    throw new Error("Square SDK failed to load");
  }

  // 3️⃣ Instantiate client
  const client = new Client({
    environment: applicationId.startsWith("sandbox-")
      ? Environment.Sandbox
      : Environment.Production,
    accessToken,
  });

  // 4️⃣ Create payment
  const idempKey = input.idempotencyKey || randomUUID();
  let payment: any;
  try {
    const resp = await client.paymentsApi.createPayment({
      sourceId:       input.nonce,
      idempotencyKey: idempKey,
      amountMoney: {
        amount:   BigInt(input.amountCents),
        currency: applicationId.startsWith("sandbox-") ? "CAD" : "USD",
      },
    });
    payment = resp.result.payment;
  } catch (e: any) {
    console.error("paymentService.charge → Square error:", e);
    throw new Error(e.message || "Square payment failed");
  }

  if (!payment?.id || !payment?.status) {
    throw new Error("Square returned no payment or status");
  }

  return {
    paymentId: payment.id,
    status:    payment.status as "COMPLETED" | "PENDING",
  };
}

/**
 * refundPayment
 *
 * Issues a refund for a completed payment via Square,
 * taking the paid amount and refunding (amountCents).
 */
export async function refundPayment(
  input: RefundPaymentInput
): Promise<RefundPaymentResult> {
  // 1️⃣ Look up & decrypt creds
  const store = new PaymentCredentialStore();
  const cred  = await store.getByConsumer("square", input.toBeUsedBy);
  if (!cred) {
    throw new Error(`No Square credentials for toBeUsedBy="${input.toBeUsedBy}"`);
  }
  const { applicationId, accessToken } = cred.credentials;
  if (!applicationId || !accessToken) {
    throw new Error("Misconfigured Square credentials");
  }

  // 2️⃣ Load Square SDK
  // @ts-ignore
  const { Client, Environment } = require("square/legacy");
  if (!Client || !Environment) {
    throw new Error("Square SDK failed to load");
  }

  // 3️⃣ Instantiate client
  const client = new Client({
    environment: applicationId.startsWith("sandbox-")
      ? Environment.Sandbox
      : Environment.Production,
    accessToken,
  });

  // 4️⃣ Issue refund
  const idempKey = input.idempotencyKey || randomUUID();
  let refund: any;
  try {
    const resp = await client.refundsApi.refundPayment({
      idempotencyKey: idempKey,
      paymentId:      input.paymentId,
      amountMoney: {
        amount:   BigInt(input.amountCents),
        currency: applicationId.startsWith("sandbox-") ? "CAD" : "USD",
      },
    });
    refund = resp.result.refund;
  } catch (e: any) {
    console.error("paymentService.refund → Square error:", e);
    throw new Error(e.message || "Square refund failed");
  }

  if (!refund?.id || !refund?.status) {
    throw new Error("Square returned no refund or status");
  }

  return {
    refundId: refund.id,
    status:   refund.status as "COMPLETED" | "PENDING" | "FAILED",
  };
}
