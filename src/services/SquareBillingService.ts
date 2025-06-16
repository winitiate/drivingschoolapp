// src/services/SquareBillingService.ts

/**
 * SquareBillingService.ts
 *
 * Production‐only wrapper around the `createPayment` Firebase callable.
 *
 * IMPORTANT: make sure the `functions` import path is exactly "../firebase",
 * so that it points at src/firebase.ts and yields the real Functions instance.
 */

import { httpsCallable } from "firebase/functions";
// 🔥 Correct relative path: services/* → firebase.ts is one level up
import { functions } from "../firebase";

export interface CreatePaymentRequest {
  appointmentId: string;
  toBeUsedBy:    string;
  amountCents:   number;
  nonce:         string;
}

export interface CreatePaymentResponse {
  success: boolean;
  payment: {
    paymentId: string;
    status:    "COMPLETED" | "PENDING";
  };
}

/**
 * Calls the `createPayment` callable Function.
 * @param data  appointmentId, toBeUsedBy, amountCents, nonce
 */
export async function createPayment(
  data: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  // functions MUST be the Firebase Functions instance from src/firebase.ts
  const fn = httpsCallable<CreatePaymentRequest, CreatePaymentResponse>(
    functions,
    "createPayment"
  );
  const res = await fn(data);
  return res.data;
}
