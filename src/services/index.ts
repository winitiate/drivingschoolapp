// src/services/index.ts

import { BillingService } from './BillingService';
import { SquareBillingService } from './SquareBillingService';
// import { StripeBillingService } from './StripeBillingService'; // when you add Stripe

// Read which provider to use from env
const provider = import.meta.env.VITE_PAYMENT_PROVIDER;

let billingService: BillingService;
if (provider === 'stripe') {
  // billingService = new StripeBillingService();
  throw new Error('StripeBillingService not yet implemented');
} else {
  // default to Square
  billingService = new SquareBillingService();
}

export default billingService;
