// src/services/SquareBillingService.ts

/**
 * SquareBillingService.ts
 *
 * Production‐only wrapper around your deployed createPayment function.
 * Uses the Firebase Functions SDK to call the live endpoint.
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export interface CreatePaymentRequest {
  appointmentId: string;
  ownerType: string;
  ownerId: string;
  toBeUsedBy: string;
  appointmentTypeId: string;
  amountCents: number;
  nonce: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  payment: {
    paymentId: string;
    status: "COMPLETED" | "PENDING";
    // any other fields your backend returns
  };
}

/**
 * Calls the live createPayment Cloud Function.
 * This will hit your deployed endpoint—no emulator involved.
 */
export async function createPayment(
  data: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  const fn = httpsCallable<CreatePaymentRequest, CreatePaymentResponse>(
    functions,
    "createPayment"
  );
  const res = await fn(data);
  return res.data;
}
