/**
 * src/services/cancelAppointment.ts
 *
 * Front-end wrapper for the Callable Cloud Function “cancelAppointment”.
 */

import { httpsCallable } from "firebase/functions";
import { functions }     from "../firebase";

export interface CancelAppointmentInput {
  appointmentId: string;
  cancellationFeeCents?: number;
  acceptCancellationFee?: boolean;
}
export interface CancelAppointmentResult {
  success: boolean;
  requiresConfirmation?: boolean;
  cancellationFeeCents?: number;
  refundResult?: {
    refundId: string;
    status:   "COMPLETED" | "PENDING" | "FAILED";
  };
}

export function cancelAppointment(
  input: CancelAppointmentInput
): Promise<CancelAppointmentResult> {
  return httpsCallable<
    CancelAppointmentInput,
    CancelAppointmentResult
  >(functions, "cancelAppointment")(input).then((r) => r.data);
}
