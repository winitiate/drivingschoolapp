// src/models/Asset.ts

import { BaseEntity } from './BaseEntity';

/**
 * Generic “asset” (vehicle, equipment, room, etc.)
 */
export interface Asset extends BaseEntity {
  status: 'available' | 'in_maintenance' | 'retired';
  type: string;
  name: string;
  serialNumber?: string;
  purchaseDate?: Date;
  metadata?: Record<string, any>;

  customFields?: Record<string, any>;
}
