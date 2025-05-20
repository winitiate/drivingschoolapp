// src/models/Business.ts

import { BaseEntity } from './BaseEntity';

/**
 * Top-level business entity (owns locations).
 */
export interface Business extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;

  /**
   * White-labeling
   */
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  customFields?: Record<string, any>;
}
