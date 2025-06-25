/**
 * index.ts
 *
 * Barrel that re-exports every callable / HTTPS Cloud Function.
 * ------------------------------------------------------------
 *  • ONE cancelAppointment export (points to handlers/cancelAppointment.ts)
 *  • Adds rescheduleAppointment so the client can call it
 *  • Leaves all existing handlers untouched
 *
 * Note: in the compiled JavaScript Firebase deploy picks up the `.js`
 * files, so each path ends with “.js”.
 */

export { bookAppointment }        from "./handlers/bookAppointment.js";
export { refundPayment }          from "./handlers/refundPayment.js";
export { webhookHandler }         from "./handlers/webhookHandler.js";
export { cancelAppointment }      from "./handlers/cancelAppointment.js";
export { rescheduleAppointment }  from "./handlers/rescheduleAppointment.js";
