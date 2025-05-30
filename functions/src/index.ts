// Initialize Firebase Admin so getFirestore() works
import { initializeApp } from "firebase-admin/app";
initializeApp();

// Export your two HTTPS functions
import { createPayment } from "./payments/createPayment";
import { updates }       from "./payments/updates";

export { createPayment, updates };
