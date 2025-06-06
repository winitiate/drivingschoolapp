// functions/src/index.ts

import { initializeApp } from "firebase-admin/app";
initializeApp();   // ← exactly one call here

// ──────────────────────────────
// Existing payment functions
// ──────────────────────────────
export { cancelAppointment } from "./payments/cancelAppointment";
export { createPayment } from "./payments/createPayment";
export { updates } from "./payments/updates";

// ──────────────────────────────
// Onboarding triggers
// ──────────────────────────────
export { onNewServiceProviderPending } from "./onboarding/onNewServiceProviderPending";
export { onNewClientPending } from "./onboarding/onNewClientPending";
export { onNewBusinessOwnerPending } from "./onboarding/onNewBusinessOwnerPending";
export { onNewServiceLocationAdminPending } from "./onboarding/onNewServiceLocationAdminPending";

// ──────────────────────────────
// Stripe subscription endpoints
// ──────────────────────────────
export { createSubscriptionStripe } from "./subscriptions/createSubscriptionStripe";
export { stripeWebhook } from "./subscriptions/stripeWebhook";

// ──────────────────────────────
// Square subscription endpoints
// ──────────────────────────────
export { createSubscriptionSquare } from "./subscriptions/createSubscriptionSquare";
export { squareWebhook } from "./subscriptions/squareWebhook";
