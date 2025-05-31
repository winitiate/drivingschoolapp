// functions/src/payments/cancelAppointment.ts
import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { SquareGateway } from "./gateways/SquareGateway";

interface CallData {
  appointmentId: string;
  paymentId: string;
  reason?: string;
}

/**
 * Callable Cloud Function: cancelAppointment
 *
 * Front-end:
 *   const fn = httpsCallable(functions, "cancelAppointment");
 *   await fn({ appointmentId, paymentId, reason });
 */
export const cancelAppointment = onCall<CallData>(
  async (req: CallableRequest<CallData>) => {
    const { appointmentId, paymentId, reason } = req.data;

    if (!appointmentId || !paymentId) {
      throw new Error("Missing appointmentId or paymentId");
    }

    /* 1️⃣  Load the appointment */
    const db = getFirestore();
    const apptRef = db.collection("appointments").doc(appointmentId);
    const snap = await apptRef.get();
    if (!snap.exists) {
      throw new Error("Appointment not found");
    }
    const appt = snap.data() as any;
    const ownerType = "serviceLocation";
    const ownerId = appt.serviceLocationId as string;

    /* 2️⃣  Refund through Square */
    const gateway = new SquareGateway();
    const refund = await gateway.refundPayment({
      ownerType,
      ownerId,
      paymentId,
      reason,
    });

    /* 3️⃣  Update Firestore */
    await apptRef.update({
      status: "refunded",
      refundId: refund.refundId,
      refundStatus: refund.status,
    });

    return { success: true, refund };
  },
);
