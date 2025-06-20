/**
 * index.ts  —  export all Cloud Functions
 * Only ONE cancelAppointment export, pointing to the file above.
 */

export { bookAppointment }   from "./handlers/bookAppointment.js";
export { refundPayment }     from "./handlers/refundPayment.js";
export { webhookHandler }    from "./handlers/webhookHandler.js";
export { cancelAppointment } from "./handlers/cancelAppointment.js";
