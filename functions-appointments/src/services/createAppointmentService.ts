// functions/src/services/createAppointmentService.ts

/**
 * createAppointmentService.ts
 *
 * Single‐purpose service that writes an appointment document into Firestore.
 * 
 * It:
 *   1) Extracts the appointmentId (used as the Firestore doc ID).
 *   2) Strips out appointmentId from the payload so we never write an undefined field.
 *   3) Writes the rest of appointmentData under appointments/{appointmentId}.
 */

import { getFirestore } from "firebase-admin/firestore";

export interface CreateAppointmentInput {
  appointmentId:   string;
  appointmentData: Record<string, any>;
}

export interface CreateAppointmentResult {
  success: boolean;
}

export async function createAppointmentService(
  input: CreateAppointmentInput
): Promise<CreateAppointmentResult> {
  const db = getFirestore();
  const { appointmentId, appointmentData } = input;

  // Copy payload and remove appointmentId so Firestore never sees undefined
  const dataToSave = { ...appointmentData };
  delete (dataToSave as any).appointmentId;

  // Write to Firestore under appointments/{appointmentId}
  await db
    .collection("appointments")
    .doc(appointmentId)
    .set(dataToSave);

  return { success: true };
}
