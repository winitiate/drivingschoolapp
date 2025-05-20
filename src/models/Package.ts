// src/models/Package.ts

import { BaseEntity } from './BaseEntity';

/**
 * Generic package or bundled offer.
 */
export interface Package extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  /** Which location owns this package */
  serviceLocationId: string;

  customFields?: Record<string, any>;
}
