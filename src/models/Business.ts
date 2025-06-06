import { BaseEntity } from './BaseEntity';

/**
 * Top-level business entity (owns locations).
 *
 * Now supports multiple owners via ownerIds array.
 */
export interface Business extends BaseEntity {
  // ────────────────────────────────────────────────────────────────────────────
  // Essential Info
  // ────────────────────────────────────────────────────────────────────────────
  name: string;
  email?: string;
  phone?: string;
  website?: string;

  // ────────────────────────────────────────────────────────────────────────────
  // Address Information
  // ────────────────────────────────────────────────────────────────────────────
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Ownership & Membership
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * The UIDs of the user(s) who “own” this business.
   * Use array‐contains queries (in Firestore) to find businesses where
   * a given UID is in ownerIds.
   */
  ownerIds: string[];

  /**
   * Convenience copies of owner display names. Index correspondence with ownerIds.
   * (Optional—only for quick display; you can drop if you prefer to fetch names separately.)
   */
  ownerNames?: string[];

  /**
   * Convenience copies of owner emails. Index correspondence with ownerIds.
   * (Optional—only for quick display/search.)
   */
  ownerEmails?: string[];

  /**
   * Convenience copies of owner phone numbers. Index correspondence with ownerIds.
   */
  ownerPhones?: string[];

  /**
   * If you allow “members” (e.g. employees) in addition to owners,
   * list their UIDs here for array‐contains membership queries.
   */
  memberIds?: string[];

  // ────────────────────────────────────────────────────────────────────────────
  // Business Classification
  // ────────────────────────────────────────────────────────────────────────────
  businessType?: string;
  industry?: string;

  // ────────────────────────────────────────────────────────────────────────────
  // Operational Status
  // ────────────────────────────────────────────────────────────────────────────
  status?: 'active' | 'pending' | 'suspended' | 'closed';

  // ────────────────────────────────────────────────────────────────────────────
  // Registration & Legal
  // ────────────────────────────────────────────────────────────────────────────
  taxId?: string;
  registrationDate?: Date;

  // ────────────────────────────────────────────────────────────────────────────
  // Localization & Preferences
  // ────────────────────────────────────────────────────────────────────────────
  timezone?: string;
  defaultLanguage?: string;

  // ────────────────────────────────────────────────────────────────────────────
  // Branding & Customization
  // ────────────────────────────────────────────────────────────────────────────
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Additional Notes
  // ────────────────────────────────────────────────────────────────────────────
  notes?: string;

  // ────────────────────────────────────────────────────────────────────────────
  // Custom extensibility
  // ────────────────────────────────────────────────────────────────────────────
  customFields?: Record<string, any>;

  // ────────────────────────────────────────────────────────────────────────────
  // Timestamps (inherited from BaseEntity: id, createdAt, updatedAt)
  // ────────────────────────────────────────────────────────────────────────────
}
