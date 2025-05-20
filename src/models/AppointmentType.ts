// src/models/AppointmentType.ts

import { BaseEntity } from './BaseEntity';

export interface AppointmentType extends BaseEntity {
  serviceLocationId: string;

  title: string;
  description?: string;

  durationMinutes?: number;
  price?: number;

  order?: number;
  customFields?: Record<string, any>;
}
