/**
 * rescheduleAppointmentService.ts
 *
 * 1. Creates a brand-new appointment document (ID comes from caller)
 * 2. Marks the original appointment { status:"rescheduled", … }
 * 3. Updates EVERY payment doc whose appointmentId === oldAppointmentId:
 *      • appointmentId      ← newId            (single-value field)
 *      • appointmentIds[]   ← arrayUnion(newId)
 * 4. Returns { success:true , newAppointmentId }
 */

import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError }               from "firebase-functions/v2/https";
import {
  RescheduleAppointmentInput,
  RescheduleAppointmentResult,
} from "../types/appointment";

export async function rescheduleAppointmentService(
  input: RescheduleAppointmentInput
): Promise<RescheduleAppointmentResult> {

  if (!input.oldAppointmentId || !input.newAppointmentData?.id) {
    throw new HttpsError(
      "invalid-argument",
      "Missing oldAppointmentId or newAppointmentData.id"
    );
  }

  const db       = getFirestore();
  const oldId    = input.oldAppointmentId;
  const newId    = input.newAppointmentData.id;
  const oldRef   = db.collection("appointments").doc(oldId);
  const oldSnap  = await oldRef.get();

  if (!oldSnap.exists) {
    throw new HttpsError("not-found", `Original appointment “${oldId}” not found`);
  }

  /* ------------------------------------------------------------------ */
  // batch so we keep both docs in sync even under contention
  const batch = db.batch();

  /* 1️⃣  create the new appointment */
  const newRef = db.collection("appointments").doc(newId);
  batch.set(newRef, input.newAppointmentData);

  /* 2️⃣  mark the old appointment as rescheduled */
  batch.update(oldRef, {
    status:         "rescheduled",
    rescheduledTo:  newId,
    rescheduledAt:  admin.firestore.FieldValue.serverTimestamp(),
  });

  /* 3️⃣  relink ALL payments that reference the old appointment ------- */
  const paySnap = await db
    .collection("payments")
    .where("appointmentId", "==", oldId)
    .get();

  paySnap.forEach((docSnap) => {
    const ref = docSnap.ref;
    batch.update(ref, {
      appointmentId:  newId,
      appointmentIds: FieldValue.arrayUnion(newId),
      rescheduledFromApptId: oldId,
      rescheduledToApptId:   newId,
    });
  });

  await batch.commit();

  return { success: true, newAppointmentId: newId };
}
