// src/data/SubscriptionStore.ts

import type { Subscription } from "../models/Subscription";

export interface SubscriptionStore {
  /** Fetch by Stripe subscription ID (doc ID) */
  getById(id: string): Promise<Subscription | null>;

  /** Fetch the active subscription for a given business UID */
  getByBusinessId(businessId: string): Promise<Subscription | null>;

  /** Save or update a subscription record (called by webhook handlers) */
  save(subscription: Subscription): Promise<void>;
}
