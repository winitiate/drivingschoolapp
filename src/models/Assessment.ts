// src/models/Assessment.ts

import { BaseEntity } from './BaseEntity';

export interface Assessment extends BaseEntity {
  appointmentId: string;
  createdBy: string;

  criteria: Array<{ name: string; rating: number; description?: string }>;
  overallRating: number;
  comments: string;
  attachments: string[];

  customFields?: Record<string, any>;
}
