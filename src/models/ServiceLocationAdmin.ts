// src/models/ServiceLocationAdmin.ts

import { BaseEntity } from './BaseEntity';

export interface ServiceLocationAdmin extends BaseEntity {
  userId: string;
  serviceLocationId: string;
  permissions?: string[];

  customFields?: Record<string, any>;
}
