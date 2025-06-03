/**
 * src/services/cancelAppointment.ts
 *
 * This module provides a single exported function, `cancelAppointment`, which
 * invokes the Firebase Callable Function named "cancelAppointment" in order to:
 *   1) Issue a refund via Square for a given appointment.
 *   2) Update Firestore documents (appointment status, refund details).
 *
 * The `cancelAppointment` export wraps the Firebase Functions SDK's `httpsCallable`
 * call, packaging up the required arguments (appointmentId, paymentId, amountCents,
 * reason) and sending them to the backend.
 *
 * Usage:
 *   import { cancelAppointment } from "./services/cancelAppointment";
 *
 *   await cancelAppointment({
 *     appointmentId: "abcd1234",
 *     paymentId:     "pay_5678",
 *     amountCents:   2500,
 *     reason:        "Client requested cancellation",
 *   });
 *
 * Requirements:
 *   • The Firebase App must already be initialized in src/firebase.ts
 *     (exporting `functions`).
 *   • A Callable Function called "cancelAppointment" must be deployed
 *     (or running in your emulator) using the same project/region.
 *
 * Important:
 *   • If your Cloud Function is deployed to a non-default region (e.g., "us-west1"),
 *     you must update the `httpsCallable` call below to:
 *       httpsCallable(functions, "us-west1-cancelAppointment")
 *   • If you are running a local emulator, ensure that `functions` was connected
 *     to the emulator via `connectFunctionsEmulator` in src/firebase.ts.
 */

import { functions } from "../firebase";          // Initialized Firebase Functions instance
import { httpsCallable, HttpsCallableResult } from "firebase/functions";

///////////////////////////////
// Interface: CancelArgs
///////////////////////////////

/**
 * The shape of data that the front end must pass when calling
 * the "cancelAppointment" callable function.
 *
 * Fields:
 *   appointmentId (string) – Firestore document ID of the appointment to cancel.
 *   paymentId     (string) – Firestore document ID of the payment to refund.
 *   amountCents   (number) – Amount (in cents) to refund via Square.
 *   reason        (string) – Textual reason for the cancellation/refund.
 */
export interface CancelArgs {
  appointmentId: string;
  paymentId:     string;
  amountCents:   number;
  reason:        string;
}

///////////////////////////////
// Function: cancelAppointment
///////////////////////////////

/**
 * Calls the Firebase Callable Function "cancelAppointment" with the provided
 * arguments. The Callable Function (in functions/src/payments/cancelAppointment.ts)
 * performs the following steps on the backend:
 *   1) Validates that appointmentId, paymentId, and amountCents are present.
 *   2) Looks up the appointment document in Firestore.
 *   3) Issues a refund through Square (via the SquareGateway).
 *   4) Updates Firestore appointment document, setting status="cancelled",
 *      recording refundId, refundStatus, and cancellation object.
 *   5) Updates Firestore payment document with refund details.
 *
 * The client only needs to await this function; any errors thrown by the
 * backend (e.g., missing arguments, Square errors, Firestore errors) will
 * propagate as rejected Promises.
 *
 * @param args {CancelArgs} – Contains appointmentId, paymentId, amountCents, reason.
 * @returns {Promise<HttpsCallableResult<any>>} – Resolves with the data returned by the backend,
 *          which typically has a shape like { success: true, refund: { refundId, status } }.
 *
 * Example:
 *   try {
 *     const result = await cancelAppointment({
 *       appointmentId: "abcd1234",
 *       paymentId:     "pay_5678",
 *       amountCents:   5000,
 *       reason:        "Scheduling conflict",
 *     });
 *     console.log("Refund succeeded:", result.data);
 *   } catch (error) {
 *     console.error("Refund failed:", error);
 *   }
 */
export async function cancelAppointment(
  args: CancelArgs
): Promise<HttpsCallableResult<unknown>> {
  // Invoke the callable function. This will send an HTTPS POST to:
  //   <your-project-region>-<your-project-id>.cloudfunctions.net/cancelAppointment
  // (Or the emulator if configured in src/firebase.ts).
  //
  // If you deployed to a non-default region, change "cancelAppointment" to
  // "<region>-cancelAppointment".
  return httpsCallable<CancelArgs, any>(functions, "cancelAppointment")(args);
}
