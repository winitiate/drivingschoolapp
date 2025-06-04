// functions/src/index.ts

import { initializeApp } from "firebase-admin/app";
initializeApp();

// Existing payment functions
export { cancelAppointment } from "./payments/cancelAppointment";
export { createPayment } from "./payments/createPayment";
export { updates } from "./payments/updates";

// Onboarding triggers
export { onNewServiceProviderPending } from "./onboarding/onNewServiceProviderPending";
export { onNewClientPending } from "./onboarding/onNewClientPending";
export { onNewBusinessOwnerPending } from "./onboarding/onNewBusinessOwnerPending";
export { onNewServiceLocationAdminPending } from "./onboarding/onNewServiceLocationAdminPending";
