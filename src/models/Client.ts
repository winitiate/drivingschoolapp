// src/models/Client.ts

import { BaseEntity } from './BaseEntity';

/**
 * End-user of your service.
 * Profile stored in users/{uid}, this holds client-specific data.
 */
export interface Client extends BaseEntity {
  /** Link back to users/{uid} */
  userId: string;

  /** Which locations they belong to */
  clientLocationIds: string[];

  /** Arbitrary per-location/client data */
  customFields?: Record<string, any>;
}
