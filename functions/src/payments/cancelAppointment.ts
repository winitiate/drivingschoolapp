// functions/src/payments/cancelAppointment.ts

import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore }            from "firebase-admin/firestore";
import { SquareGateway }           from "./gateways/SquareGateway";

interface CallData {
  appointmentId: string;
  paymentId:     string;
  amountCents:   number;
  reason:        string;
}

export const cancelAppointment = onCall<CallData>(async (req: CallableRequest<CallData>) => {
  const { appointmentId, paymentId, amountCents, reason } = req.data;

  // 1) Validate inputs
  if (!appointmentId || !paymentId || typeof amountCents !== "number") {
    console.error("cancelAppointment → missing or invalid arguments:", {
      appointmentId,
      paymentId,
      amountCents,
      reason,
    });
    throw new Error("Missing appointmentId, paymentId, or amountCents");
  }

  // 2) Verify appointment exists & gather owner info
  const db      = getFirestore();
  const apptRef = db.collection("appointments").doc(appointmentId);
  const snap    = await apptRef.get();
  if (!snap.exists) {
    console.error("cancelAppointment → appointment not found:", appointmentId);
    throw new Error("Appointment not found");
  }
  const apptData = snap.data() as any;
  const ownerType = "serviceLocation";
  const ownerId   = apptData.serviceLocationId as string;
  if (!ownerId) {
    console.error("cancelAppointment → cannot determine ownerId from appointment metadata:", apptData);
    throw new Error("Cannot determine ownerId from appointment");
  }

  // 3) Issue the refund via Square
  const gateway = new SquareGateway();

  // Log exactly what we’re about to send to Square
  console.log("cancelAppointment → calling Square.refundPayment with:", {
    ownerType,
    ownerId,
    paymentId,
    amountCents,
    reason,
  });

  let refund;
  try {
    refund = await gateway.refundPayment({
      ownerType,
      ownerId,
      paymentId,
      amountCents,
      reason,
    });
  } catch (err: any) {
    console.error("cancelAppointment → Square refundPayment threw an error:", err);
    throw new Error(`Refund failed: ${err.message || err}`);
  }

  // Log what Square returned
  console.log("cancelAppointment → Square refundPayment returned:", refund);

  // 4) Update Firestore to mark the appointment as refunded
  await apptRef.update({
    status:       "refunded",
    refundId:     refund.refundId,
    refundStatus: refund.status,
    refundedAt:   new Date(),
  });

  console.log("cancelAppointment → Firestore updated for appointment:", appointmentId);

  return { success: true, refund };
});
