import { BaseEntity } from './BaseEntity';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDef {
  /** unique key in your record */
  name: string;
  /** human-friendly label */
  label: string;
  /** renderer type */
  type: FieldType;
  /** whether it must be filled in */
  required?: boolean;
  /** for select/radio */
  options?: FieldOption[];
  /** initial value */
  defaultValue?: any;
}

/**
 * A reusable form‐schema that different roles can clone & edit.
 */
export interface FormTemplate extends BaseEntity {
  /** A short name e.g. “Driving School Intake v1” */
  name: string;

  /** e.g. “Client”, “ServiceProvider”, “Appointment” */
  entityType: string;

  /** The set of fields to collect */
  fields: FieldDef[];

  /** Optional longer explanation */
  description?: string;

  /**
   * Ownership:
   *  • if undefined → global template (super-admin only)
   *  • if businessId → scoped to that business
   *  • if locationId → scoped to that location
   */
  ownerId?: string;

  /**
   * Visibility & edit rights:
   *  • ‘global’   → only super-admins may edit
   *  • ‘business’ → business-admins & super-admins
   *  • ‘location’ → location-admins & super-admins
   */
  scope: 'global' | 'business' | 'location';
}
