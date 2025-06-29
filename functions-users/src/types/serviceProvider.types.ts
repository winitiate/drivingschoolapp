/**
 * serviceProvider.types.ts
 * ---------------------------------------------------------------
 * Canonical request/response types used by the **createServiceProvider**
 * callable Cloud Function and its front-end wrapper.
 */

/* ----- input sent from the front-end -------------------------- */
export interface CreateServiceProviderInput {
  /** required -- primary login / invite address */
  email: string;

  /** optional display info */
  firstName?: string;
  lastName?:  string;

  /** the service-location(s) this provider belongs to (≥ 1) */
  providerLocationIds: string[];

  /** arbitrary per-provider extras pushed into Firestore */
  customFields?: Record<string, unknown>;
}

/* ----- successful result returned to the front-end ------------ */
export interface CreateServiceProviderResult {
  success: true;
  providerId: string;   // Firestore serviceProviders doc id
  userUid:    string;   // Firebase Auth UID that backs it
}

/* ----------------------------------------------------------------
 *  (Optional) keep your older lightweight “ProviderPayload”
 *  if you still use it elsewhere in Cloud Functions code.
 * ---------------------------------------------------------------- */
export interface ProviderPayload {
  email: string;
  firstName?: string;
  lastName?:  string;
  providerLocationIds: string[];
  customFields?: Record<string, any>;
}
