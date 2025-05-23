// src/services/SquareBillingService.ts

import { BillingService } from './BillingService';
import { Client, CreateCustomerResponse, CreatePaymentResponse, CreateSubscriptionResponse } from 'square';

const squareClient = new Client({
  accessToken: import.meta.env.VITE_SQUARE_ACCESS_TOKEN,
  environment: import.meta.env.VITE_SQUARE_ENVIRONMENT === 'production'
    ? 'production'
    : 'sandbox',
});

export class SquareBillingService implements BillingService {
  private customersApi     = squareClient.customersApi;
  private paymentsApi      = squareClient.paymentsApi;
  private subscriptionsApi = squareClient.subscriptionsApi;

  async createCustomer(userId: string, email: string): Promise<string> {
    // …same as before…
  }

  async chargeOneTime(
    customerId: string,
    amountCents: number,
    currency: string,
    description: string
  ): Promise<string> {
    // …same as before…
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ): Promise<string> {
    const idempotencyKey = customerId + '-' + Date.now();
    const resp: CreateSubscriptionResponse = await this.subscriptionsApi.createSubscription({
      idempotencyKey,
      locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
      planId: priceId,
      customerId,
      ...(trialDays ? { trialPeriodDays: trialDays } : {}),
    });
    // …rest unchanged…
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // …unchanged…
  }
}
