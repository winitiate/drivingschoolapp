/**
 * SubscriptionPackage
 *
 * A package that a business may purchase.  Stored in Firestore under
 * the top-level collection "subscriptionPackages".
 */
export interface SubscriptionPackage {
  /** Firestore document ID (undefined when creating new) */
  id?: string;

  /** Human-friendly title, e.g. "Basic", "Pro" */
  title: string;

  /** Optional longer description */
  description?: string;

  /** Price in cents. E.g. 1999 => $19.99/month */
  priceCents: number;

  /** Maximum number of locations (null = unlimited) */
  maxLocations?: number | null;

  /** Maximum number of providers (null = unlimited) */
  maxProviders?: number | null;

  /** Maximum number of clients (null = unlimited) */
  maxClients?: number | null;

  /**
   * Used to sort the packages in the UI.  Lower `order` shows first.
   * We'll default new packages to the end of the list.
   */
  order?: number;

  /**
   * Whether this package should appear on the public /pricing page.
   * True = show; false = hide.
   */
  visible?: boolean;

  /**
   * Which call‐to‐action to show on /pricing:
   *  - "register" → “Get Started”
   *  - "contact"  → “Contact for a Quote”
   */
  callToAction?: "register" | "contact";

  /** Timestamps (populated by Firestore) */
  createdAt?: Date;
  updatedAt?: Date;
}
