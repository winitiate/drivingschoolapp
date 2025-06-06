// src/models/Subscription.ts

/**
 * A Subscription record in Firestore, mirroring a Stripe subscription.
 */
export interface Subscription {
  id?: string;               // Firestore doc ID = Stripe subscription ID
  businessId: string;        // the Firebase UID of the business (owner)
  planId: string;            // the Firestore ServicePackage ID
  stripeSubscriptionId: string;  // same as id
  status: string;            // e.g. "active", "past_due", "canceled"
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  createdAt?: any;           // Firestore Timestamp
  updatedAt?: any;           // Firestore Timestamp
}
