/**
 * index.ts  – Barrel export for client-side service helpers
 *
 * Each helper is a thin wrapper around its corresponding Cloud Function
 * (or, in the case of refundPayment, a direct Square-refund call).
 * Importing from one place keeps call-sites tidy:
 *
 *   import { bookAppointment, rescheduleAppointment } from "@/services";
 */

export { bookAppointment }         from "./bookAppointment";
export { refundPayment }           from "./refundPayment";
export { cancelAppointment }       from "./cancelAppointment";
export { rescheduleAppointment }   from "./rescheduleAppointment";
