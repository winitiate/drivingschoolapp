import { initializeApp } from "firebase-admin/app";
initializeApp();

export { cancelAppointment } from "./payments/cancelAppointment";
export { createPayment }     from "./payments/createPayment";
export { updates }           from "./payments/updates";
