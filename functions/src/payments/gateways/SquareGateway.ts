// functions/src/payments/gateways/SquareGateway.ts

import { getFirestore } from "firebase-admin/firestore";
import { decrypt }      from "../../utils/encryption";

export interface CreatePaymentInput {
  ownerType:        string;   // e.g. "serviceLocation"
  ownerId:          string;   // the ID in paymentCredentials
  idempotencyKey:   string;
  nonce:            string;   // card nonce/token from frontend
  amountCents:      number;
  appointmentTypeId: string;
}

export interface RefundPaymentInput {
  ownerType:   string;   // e.g. "serviceLocation"
  ownerId:     string;   // same ownerType/ownerId as create
  paymentId:   string;   // Square payment ID
  amountCents: number;   // amount to refund, in cents
  reason:      string;
}

interface SquareCredential {
  accessToken:   string;
  applicationId: string;
  locationId:    string;
}

// For sandbox, use sandbox base. For production, use "https://connect.squareup.com".
const SQUARE_API_BASE = "https://connect.squareupsandbox.com";

async function fetchCredential(
  ownerType: string,
  ownerId:   string
): Promise<SquareCredential> {
  const snap = await getFirestore()
    .collection("paymentCredentials")
    .where("provider", "==", "square")
    .where("ownerType", "==", ownerType)
    .where("ownerId", "==", ownerId)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error("Square credential not found");
  }
  const data = snap.docs[0].data();
  return {
    accessToken:   decrypt(data.credentials.accessToken),
    applicationId: data.credentials.applicationId,
    locationId:    data.credentials.locationId as string,
  };
}

export class SquareGateway {
  /**
   * Create a payment by calling Square’s REST API
   */
  async createPayment(input: CreatePaymentInput): Promise<{
    paymentId: string;
    status:    "COMPLETED" | "PENDING";
  }> {
    const creds = await fetchCredential(input.ownerType, input.ownerId);

    const url = `${SQUARE_API_BASE}/v2/payments`;
    const body = {
      source_id:       input.nonce,
      idempotency_key: input.idempotencyKey,
      amount_money:    { amount: input.amountCents, currency: "CAD" },
      location_id:     creds.locationId,
      note:            `ApptType:${input.appointmentTypeId}`,
    };

    console.log("SquareGateway.createPayment → request body:", JSON.stringify(body));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${creds.accessToken}`,
        "Square-Version": "2022-03-16",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    console.log("SquareGateway.createPayment → response status:", res.status, "body:", JSON.stringify(json));

    if (!res.ok) {
      const detail = Array.isArray(json.errors)
        ? json.errors.map((e: any) => e.detail).join(", ")
        : JSON.stringify(json);
      throw new Error(`Square createPayment failed: ${detail}`);
    }

    const payment = json.payment;
    if (!payment?.id || !payment?.status) {
      throw new Error("Square returned no payment or status");
    }

    return {
      paymentId: payment.id,
      status:    payment.status === "COMPLETED" ? "COMPLETED" : "PENDING",
    };
  }

  /**
   * Refund a payment by calling Square’s REST API
   */
  async refundPayment(input: RefundPaymentInput): Promise<{
    refundId: string;
    status:   "PENDING" | "COMPLETED" | "FAILED";
  }> {
    const creds = await fetchCredential(input.ownerType, input.ownerId);

    const url = `${SQUARE_API_BASE}/v2/refunds`;
    const body = {
      idempotency_key: `refund-${input.paymentId}-${Date.now()}`,
      payment_id:      input.paymentId,
      amount_money:    { amount: input.amountCents, currency: "CAD" },
      reason:          input.reason,
    };

    console.log("SquareGateway.refundPayment → request body:", JSON.stringify(body));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${creds.accessToken}`,
        "Square-Version": "2022-03-16",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    console.log("SquareGateway.refundPayment → response status:", res.status, "body:", JSON.stringify(json));

    if (!res.ok) {
      const detail = Array.isArray(json.errors)
        ? json.errors.map((e: any) => e.detail).join(", ")
        : JSON.stringify(json);
      throw new Error(`Square refundPayment failed: ${detail}`);
    }

    const refund = json.refund;
    if (!refund?.id || !refund?.status) {
      throw new Error("Square returned no refund or status");
    }

    return {
      refundId: refund.id,
      status:   refund.status as "PENDING" | "COMPLETED" | "FAILED",
    };
  }
}
