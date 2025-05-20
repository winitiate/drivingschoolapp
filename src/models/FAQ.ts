// src/models/FAQ.ts

import { BaseEntity } from './BaseEntity';

/** Frequently-asked question */
export interface FAQ extends BaseEntity {
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;

  customFields?: Record<string, any>;
}
