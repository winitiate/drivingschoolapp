/**
 * src/services/api/index.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Central barrel for *client-side* API wrappers.  Add explicit exports only;
 * no wildcards, so dead-code elimination can shake unused calls.
 */

/* ─── APPOINTMENTS ─── */
export * from "./appointments/bookAppointment";
export * from "./appointments/cancelAppointment";
export * from "./appointments/rescheduleAppointment";

/* ─── PAYMENTS ─── */
export * from "./payments/refundPayment";

/* ─── USERS & TENANTS ─── */
export * from "./users/createBusiness";
export * from "./users/createBusinessOwner";
export * from "./users/createClient";
export * from "./users/createServiceLocationAdmin";
export * from "./users/createServiceProvider";

/* ─── LIFECYCLE / STATUS ─── */
export * from "./lifecycle/setUserLifecycle";
