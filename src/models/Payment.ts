// src/models/Payment.ts

import { BaseEntity } from "./BaseEntity";

/**
 * Which payment provider processed this transaction?
 * Add other values (“stripe”, “paypal”, etc.) as needed.
 */
export type PaymentGatewayProvider = "square" | "stripe" | "paypal";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

/**
 * The merged, production-grade Payment model.
 * - Includes all your original fields (appointmentId, clientId, amount, etc.)
 * - Adds `gateway` to know which API handled the charge.
 * - Adds refund-related fields (`refundId`, `refundStatus`, `refundedAt`).
 * - Inherits `id`, `createdAt`, `updatedAt` from BaseEntity.
 */
export interface Payment extends BaseEntity {
  /** Back-reference to the appointment this charge belongs to */
  appointmentId: string;

  /** Which client made this payment */
  clientId: string;

  /** Amount in “dollars” (e.g. 45.00) */
  amount: number;

  /** ISO currency code (usually "CAD") */
  currency: string;

  /** How was this payment collected? e.g. "card", "cash", "venmo", etc. */
  tenderType: string;

  /** A unique string from the gateway (Square/Stripe/PayPal), also used as the document’s ID */
  transactionId: string;

  /** One of "pending", "paid", "refunded", or "failed" */
  paymentStatus: PaymentStatus;

  /** URL (from the gateway) where the receipt can be viewed/downloaded */
  receiptUrl: string;

  /** When this payment was first processed by the gateway */
  processedAt: Date;

  /** Which provider processed it (square, stripe, paypal, etc.) */
  gateway: PaymentGatewayProvider;

  /** If the payment has fees (in dollars), e.g. Square’s processing fee */
  fees?: number;

  /** Net total after fees (in dollars) */
  netTotal?: number;

  /** Any free-form note you want to save alongside the tender (optional) */
  tenderNote?: string;

  /** If card payments, which brand (e.g. "Visa", "Mastercard") */
  cardBrand?: string;

  /** Last 4 digits (suffix) of the card used, e.g. "4242" */
  panSuffix?: string;

  /** A link to view more detailed payment info (optional) */
  detailsUrl?: string;

  /** Arbitrary extra fields you want to attach (optional) */
  customFields?: Record<string, any>;

  /** ─── Refund-related fields ─── */

  /** The gateway’s refund ID (if this payment was refunded) */
  refundId?: string;

  /** One of "pending" | "paid" → "refunded" | "failed" (tracks refund status) */
  refundStatus?: PaymentStatus;

  /** When (in your system) the refund was executed */
  refundedAt?: Date;
}
