// src/models/ServicePackage.ts

/**
 * A subscription plan (service package) for a business tenant.
 */
export interface ServicePackage {
  id?: string;

  /** Display name, e.g. "Basic Plan" */
  name: string;

  /** Marketing‐style description */
  description: string;

  /** Price in cents, e.g. 1999 = $19.99 */
  priceCents: number;

  /** Billing interval: "month" or "year" */
  interval: "month" | "year";

  /** The Stripe Price ID (e.g. "price_1AbCdeFGhIJKLmNoPq") */
  stripePriceId: string;

  /** Feature limits */
  maxLocations?: number | null;
  maxProviders?: number | null;
  maxClients?: number | null;

  /** Is this plan currently visible/swappable by new customers? */
  active: boolean;

  /** Timestamps (set by FirestoreServicePackageStore) */
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}
