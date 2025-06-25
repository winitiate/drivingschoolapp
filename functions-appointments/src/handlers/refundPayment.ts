// functions/src/handlers/refundPayment.ts

/**
 * refundPayment.ts
 *
 * 1️⃣ Validates: toBeUsedBy, paymentId, amountCents, reason
 * 2️⃣ Issues the refund via Square (refundService)
 * 3️⃣ Loads the Firestore payment doc to get appointmentId
 * 4️⃣ Marks appointment as cancelled and records refund details
 * 5️⃣ Updates the payment doc with the refund fields
 * 6️⃣ Returns { refundId, status }
 */
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// 👉 Import the “refund” function your service actually exports
import { refund as _refund } from "../services/refundService";

import type {
  RefundPaymentInput,
  RefundPaymentResult,
} from "../types/payment";

// Initialize Admin SDK once
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const refundPayment = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<RefundPaymentInput>
  ): Promise<RefundPaymentResult> => {
    // 1️⃣ Validate inputs
    const { toBeUsedBy, paymentId, amountCents, reason } = req.data || {};
    if (
      typeof toBeUsedBy  !== "string" ||
      typeof paymentId   !== "string" ||
      typeof amountCents !== "number" ||
      typeof reason      !== "string"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Required: toBeUsedBy (string), paymentId (string), amountCents (number), reason (string)."
      );
    }

    // 2️⃣ Issue the refund via your service
    let refundResult: RefundPaymentResult;
    try {
      refundResult = await _refund({ toBeUsedBy, paymentId, amountCents, reason });
    } catch (err: any) {
      console.error("refundPayment → Square error:", err);
      throw new HttpsError("internal", err.message || "Refund failed");
    }

    const { refundId, status: refundStatus } = refundResult;

    // 3️⃣ Fetch the existing payment doc to find the appointmentId
    const payDocRef = db.collection("payments").doc(paymentId);
    const paySnap   = await payDocRef.get();

    if (paySnap.exists) {
      const payData = paySnap.data() as { appointmentId?: string };

      // 4️⃣ If we have an appointmentId, update that appointment
      if (payData.appointmentId) {
        const apptRef = db.collection("appointments").doc(payData.appointmentId);
        await apptRef.update({
          status:       "cancelled",
          refundId,
          refundStatus,
          refundedAt:   admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 5️⃣ Update the payment doc itself with refund details
      await payDocRef.set(
        {
          refundId,
          refundStatus,
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      console.warn("refundPayment → payment doc not found:", paymentId);
    }

    // 6️⃣ Return just the refund result to the client
    return refundResult;
  }
);
