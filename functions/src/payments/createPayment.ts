// functions/src/payments/createPayment.ts

/**
 * createPayment.ts
 *
 * Firebase v2 callable Function to charge via Square,
 * looking up credentials by toBeUsedBy and forcing CAD
 * in sandbox (to match your merchant).
 */

import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { randomUUID } from "crypto";
import { FirestorePaymentCredentialStore } from "../utils/FirestorePaymentCredentialStore";
import { PaymentCredentialStore }            from "../utils/PaymentCredentialStore";

// 1️⃣ Initialize Admin SDK once
if (!admin.apps.length) admin.initializeApp();

interface PaymentData {
  appointmentId: string;
  toBeUsedBy:    string;
  amountCents:   number;
  nonce:         string;
}
interface PaymentResponse {
  success: boolean;
  payment: {
    paymentId: string;
    status:    "COMPLETED" | "PENDING";
  };
}

export const createPayment = onCall(
  {
    memory:         "256MiB",
    timeoutSeconds: 30,
  },
  async (req: CallableRequest<PaymentData>): Promise<PaymentResponse> => {
    // Log what we received
    console.log("💥 createPayment called with:", req.data);

    // 2️⃣ Validate inputs
    const { appointmentId, toBeUsedBy, amountCents, nonce } = req.data || {};
    if (
      typeof appointmentId !== "string" ||
      typeof toBeUsedBy    !== "string" ||
      typeof amountCents   !== "number" ||
      typeof nonce         !== "string"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Required: appointmentId (string), toBeUsedBy (string), amountCents (number), nonce (string)."
      );
    }

    // 3️⃣ Lookup that location’s Square creds
    const store: PaymentCredentialStore = new FirestorePaymentCredentialStore();
    const cred = await store.getByConsumer("square", toBeUsedBy);
    console.log("🎯 Credential fetched:", cred);
    if (!cred) {
      throw new HttpsError("not-found", `No credentials for toBeUsedBy="${toBeUsedBy}".`);
    }

    const { applicationId, accessToken } = cred.credentials;
    if (!applicationId || !accessToken) {
      throw new HttpsError(
        "failed-precondition",
        "Misconfigured credentials (missing applicationId or accessToken)."
      );
    }

    // 4️⃣ Pick currency: ALWAYS CAD for sandbox
    const currency = applicationId.startsWith("sandbox-") ? "CAD" : "USD";
    console.log("🌍 Using currency:", currency);

    // 5️⃣ Load the legacy Square SDK so Client & Environment exist
    // @ts-ignore
    const { Client, Environment } = require("square/legacy");
    if (typeof Client !== "function" || !Environment) {
      console.error("Square/legacy exports are invalid", { Client, Environment });
      throw new HttpsError("internal", "Square SDK failed to load.");
    }

    // 6️⃣ Instantiate Square client
    const squareClient = new Client({
      environment: applicationId.startsWith("sandbox-")
        ? Environment.Sandbox
        : Environment.Production,
      accessToken,
    });

    // 7️⃣ Create the payment
    let payment: any;
    try {
      console.log("🔔 Calling Square with:", {
        sourceId: nonce,
        idempotencyKey: randomUUID(),
        amountMoney: { amount: BigInt(amountCents), currency },
      });

      const resp = await squareClient.paymentsApi.createPayment({
        sourceId:       nonce,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount:   BigInt(amountCents),
          currency,
        },
      });
      payment = resp.result.payment;
    } catch (err: any) {
      console.error("🚨 Square API error:", err);
      throw new HttpsError("internal", err.message || "Square API error");
    }

    if (!payment) {
      throw new HttpsError("internal", "Square did not return a payment object.");
    }

    // 8️⃣ Success
    console.log("✅ Payment succeeded:", payment.id, payment.status);
    return {
      success: true,
      payment: {
        paymentId: payment.id,
        status:    payment.status as "COMPLETED" | "PENDING",
      },
    };
  }
);
