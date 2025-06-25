/**
 * updateAppointmentStatusService.ts
 *
 * Pure business logic for updating the status of an existing appointment:
 * - Receives appointmentId, new status string, and optional metadata object
 * - Patches appointments/{appointmentId} with status + metadata
 * - Returns { success: true } or throws on any error
 */

import * as admin from "firebase-admin";
import {
  UpdateAppointmentStatusInput,
  UpdateAppointmentStatusResult,
} from "../types/appointment";

// Initialize Admin SDK if not already
if (!admin.apps.length) admin.initializeApp();

const firestore = admin.firestore();

export async function updateAppointmentStatusService(
  input: UpdateAppointmentStatusInput
): Promise<UpdateAppointmentStatusResult> {
  const { appointmentId, status, metadata } = input;

  // Build the patch object
  const updateObj: Record<string, any> = { status };
  if (metadata) {
    Object.assign(updateObj, metadata);
  }

  // Apply the update
  await firestore
    .collection("appointments")
    .doc(appointmentId)
    .update(updateObj);

  return { success: true };
}
