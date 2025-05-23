import { BaseEntity } from './BaseEntity';

/**
 * Top-level business entity (owns locations).
 */
export interface Business extends BaseEntity {
  // Essential Info
  name: string;
  email?: string;
  phone?: string;
  website?: string;

  // Address information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Owner Information
  ownerId?: string;        // UID of the user who owns this business
  ownerName?: string;
  ownerEmail?: string;     // convenience copy of their email
  ownerPhone?: string;

  // Business Classification
  businessType?: string;   // e.g., Retail, Service, Education, etc.
  industry?: string;       // industry/category classification

  // Operational Status
  status?: 'active' | 'pending' | 'suspended' | 'closed';

  // Registration & Legal
  taxId?: string;
  registrationDate?: Date;

  // Localization
  timezone?: string;
  defaultLanguage?: string;

  // Branding & Customization
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  // Additional Notes
  notes?: string;

  // Custom extensibility
  customFields?: Record<string, any>;
}
