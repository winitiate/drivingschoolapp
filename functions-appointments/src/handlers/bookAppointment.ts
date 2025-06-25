/**
 * bookAppointment.ts
 *
 * v2 Callable Function to:
 *   1) Charge via Square
 *   2) Create the appointment
 *   3) Save a Firestore payment document
 */

import { onCall, HttpsError }            from "firebase-functions/v2/https";
import { CallableRequest }                from "firebase-functions/v2/https";
import { charge }                         from "../services/paymentService";
import {
  createAppointmentService,
  CreateAppointmentInput,
}                                         from "../services/createAppointmentService";
import {
  savePaymentRecord,
  SavePaymentRecordInput,
}                                         from "../services/paymentRecordService";
import {
  CreatePaymentInput,
  CreatePaymentResult,
}                                         from "../types/payment";

interface BookAppointmentInput extends CreatePaymentInput {
  appointmentData: Record<string, any>;
}

interface BookAppointmentResult {
  success: boolean;
  payment: CreatePaymentResult;
}

export const bookAppointment = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<BookAppointmentInput>
  ): Promise<BookAppointmentResult> => {
    const data = req.data || {};

    // 1️⃣ Validate
    const { toBeUsedBy, nonce, amountCents, idempotencyKey, appointmentData } = data;
    if (
      typeof toBeUsedBy                     !== "string" ||
      typeof nonce                          !== "string" ||
      typeof amountCents                    !== "number" ||
      typeof appointmentData                !== "object" ||
      typeof appointmentData.appointmentId  !== "string"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Need toBeUsedBy, nonce, amountCents, and appointmentData.appointmentId"
      );
    }

    // 2️⃣ Charge
    let payment: CreatePaymentResult;
    try {
      payment = await charge({ toBeUsedBy, nonce, amountCents, idempotencyKey });
      if (!payment.paymentId || payment.status !== "COMPLETED") {
        throw new Error("Payment did not complete");
      }
    } catch (err: any) {
      console.error("bookAppointment → payment error:", err);
      throw new HttpsError("internal", err.message || "Payment failed");
    }

    // 3️⃣ Create appointment
    try {
      const createInput: CreateAppointmentInput = {
        appointmentId:   appointmentData.appointmentId,
        appointmentData,
      };
      await createAppointmentService(createInput);
    } catch (err: any) {
      console.error("bookAppointment → appointment write error:", err);
      throw new HttpsError(
        "internal",
        "Appointment creation failed after payment"
      );
    }

    // 4️⃣ Save payment record
    try {
      const recordInput: SavePaymentRecordInput = {
        appointmentId: appointmentData.appointmentId,
        amountCents,
        payment,
        clientId: undefined,  // pass a real clientId if you have one
      };
      await savePaymentRecord(recordInput);
    } catch (err: any) {
      console.error("bookAppointment → payment record error:", err);
      // we *don’t* stop the whole flow here; appointment+charge succeeded.
      // But you may alert/monitor for this failure.
    }

    // 5️⃣ Done
    return {
      success: true,
      payment,
    };
  }
);
