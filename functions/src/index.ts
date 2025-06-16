// functions/src/index.ts

/**
 * Entry point for your Cloud Functions.
 * Export each function under its filename; use .js extension to match ESM output.
 */

export { createPayment } from "./payments/createPayment.js";
export { cancelAppointment } from "./payments/cancelAppointment.js";
export { updates } from "./payments/updates.js";
// …and any other exports you have in src/payments/*
