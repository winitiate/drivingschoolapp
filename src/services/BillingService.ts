// src/services/BillingService.ts

/**
 * A provider-agnostic billing interface.
 * Implement this with Stripe, Square, or any other platform.
 */
export interface BillingService {
  /**
   * Create or fetch a customer record for a user.
   * @returns the provider’s customer ID
   */
  createCustomer(userId: string, email: string): Promise<string>;

  /**
   * Charge a one-time payment.
   * @returns the resulting payment ID
   */
  chargeOneTime(
    customerId: string,
    amountCents: number,
    currency: string,
    description: string
  ): Promise<string>;

  /**
   * Start a recurring subscription to a given price/plan.
   * @returns the resulting subscription ID
   */
  createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ): Promise<string>;

  /**
   * Cancel an active subscription.
   */
  cancelSubscription(subscriptionId: string): Promise<void>;
}
