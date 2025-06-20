// functions\src\services\rescheduleService.ts
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError }   from "firebase-functions/v2/https";
import {
  RescheduleAppointmentInput,
  RescheduleAppointmentResult,
} from "../types/appointment";

/**
 * Copies an existing appointment under a new ID, re-links any payment,
 * and marks the old appointment as rescheduled.
 */
export async function rescheduleAppointmentService(
  input: RescheduleAppointmentInput
): Promise<RescheduleAppointmentResult> {
  if (!input.oldAppointmentId || !input.newAppointmentData?.id) {
    throw new HttpsError(
      "invalid-argument",
      "Missing oldAppointmentId or newAppointmentData.id"
    );
  }

  const db      = getFirestore();
  const oldRef  = db.collection("appointments").doc(input.oldAppointmentId);
  const oldSnap = await oldRef.get();
  if (!oldSnap.exists) {
    throw new HttpsError(
      "not-found",
      `Original appointment "${input.oldAppointmentId}" not found`
    );
  }

  const old      = oldSnap.data()!;
  const newId    = input.newAppointmentData.id;

  // 1) write the new appointment
  await db.collection("appointments").doc(newId).set(input.newAppointmentData);

  // 2) mark the old as rescheduled
  await oldRef.update({
    status:        "rescheduled",
    rescheduledTo: newId,
    rescheduledAt: new Date(),
  });

  // 3) if there was a payment, re-link it
  if (old.paymentId) {
    await db
      .collection("payments")
      .doc(old.paymentId)
      .update({ appointmentId: newId });
  }

  return { success: true, newAppointmentId: newId };
}
