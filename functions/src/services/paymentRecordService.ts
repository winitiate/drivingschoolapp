/**
 * paymentRecordService.ts
 *
 * Persists a “Payment” document in Firestore under /payments/{transactionId}.
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  CreatePaymentResult,
  CreatePaymentInput,
} from "../types/payment";

export interface SavePaymentRecordInput {
  /** The same appointmentId you just created */
  appointmentId: string;
  /** The amount you charged, in cents */
  amountCents:   number;
  /** The data returned from your payment API */
  payment:       CreatePaymentResult;
  /** Who paid (optional; you can pass clientId) */
  clientId?:     string;
}

export async function savePaymentRecord(
  input: SavePaymentRecordInput
): Promise<void> {
  const db = getFirestore();
  const { appointmentId, amountCents, payment, clientId } = input;

  // Build the document shape matching your Payment model
  const now = new Date();
  const doc = {
    appointmentId,
    clientId:      clientId         ?? null,
    amount:        amountCents / 100,      // cents → dollars
    currency:      "CAD",                 // or infer dynamically
    tenderType:    "card",
    transactionId: payment.paymentId,
    paymentStatus: payment.status === "COMPLETED" ? "paid" : "pending",
    receiptUrl:    null,                  // if you have one from Square
    processedAt:   Timestamp.fromDate(now),

    // gateway & fees/netTotal left null here; extend as needed
    gateway:       "square",
    fees:          null,
    netTotal:      null,

    // timestamps
    createdAt:     Timestamp.fromDate(now),
    updatedAt:     Timestamp.fromDate(now),
  };

  // Write under /payments/{transactionId}
  await db
    .collection("payments")
    .doc(payment.paymentId)
    .set(doc);
}
