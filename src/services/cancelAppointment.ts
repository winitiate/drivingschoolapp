// src/services/cancelAppointment.ts
import { functions } from "../firebase"; // your initialized client
import { httpsCallable } from "firebase/functions";

export interface CancelArgs {
  appointmentId: string;
  paymentId:     string;
  amountCents:   number;
  reason:        string;
}

export async function cancelAppointment(args: CancelArgs) {
  await httpsCallable(functions, "cancelAppointment")(args);
}
