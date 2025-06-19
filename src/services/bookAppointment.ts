/**
 * bookAppointment.ts
 *
 * Front-end wrapper for the Firebase Callable Function "bookAppointment".
 *
 * Usage:
 *   import { bookAppointment } from "../services/bookAppointment";
 *
 *   const result = await bookAppointment({
 *     appointmentData: {
 *       appointmentId:       "APPT_123",
 *       clientIds:           ["client1"],
 *       serviceProviderIds:  ["prov1"],
 *       appointmentTypeId:   "typeA",
 *       serviceLocationId:   "loc001",
 *       startTime:           "2025-07-01T10:00:00Z",
 *       endTime:             "2025-07-01T10:30:00Z",
 *       durationMinutes:     30,
 *       status:              "scheduled",
 *       notes:               "Needs wheelchair access",
 *     },
 *     toBeUsedBy:  "loc001",          // your serviceLocationId
 *     amountCents: 5000,              // $50.00
 *     nonce:       "cnon:card-nonce", // from Square Web SDK tokenize()
 *   });
 *
 * Returns:
 *   { success: true, appointmentId: string, paymentId: string }
 */

import { httpsCallable } from "firebase/functions";
import { functions }     from "../firebase";
import type {
  BookAppointmentInput,
  BookAppointmentResult
} from "../types/appointment";

export async function bookAppointment(
  data: BookAppointmentInput
): Promise<BookAppointmentResult> {
  const fn = httpsCallable<typeof data, BookAppointmentResult>(
    functions,
    "bookAppointment"
  );
  const res = await fn(data);
  return res.data;
}
