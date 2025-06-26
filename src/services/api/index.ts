/**
 * src/services/api/index.ts
 * --------------------------------------------------------------------------
 * Groups service wrappers by domain folder but re-exports them here so that
 * the top-level barrel (src/services/index.ts) can stay one-liner simple.
 *
 * Keep **all** explicit exports here; no wildcards so dead code can tree-shake.
 */

/* ─────────────  APPOINTMENTS  ───────────── */
export * from "./appointments/bookAppointment";
export * from "./appointments/cancelAppointment";
export * from "./appointments/rescheduleAppointment";

/* ─────────────  PAYMENTS  ───────────── */
export * from "./payments/refundPayment";

/* ─────────────  USERS & TENANTS  ─────── */
export * from "./users/createBusiness";
export * from "./users/createClient";
export * from "./users/createServiceLocationAdmin";
export * from "./users/createServiceProvider";
