import { BaseEntity } from "./BaseEntity";

/**
 * AppointmentType
 *
 * Represents a bookable category of appointment at a service-location.
 * All money values are stored as integer **cents** to avoid
 * floating-point rounding issues and to align with payment-gateway APIs.
 */
export interface AppointmentType extends BaseEntity {
  /** Owning service-location */
  serviceLocationId: string;

  /** Human-readable name shown to clients */
  title: string;

  /** Optional longer description */
  description?: string;

  /** Duration in minutes (null = varies) */
  durationMinutes?: number | null;

  /** Price in **cents** (e.g. $170.00 ⇒ 17000). 0 or undefined = free. */
  priceCents?: number | null;

  /** Sort order (lower = shown first) */
  order?: number | null;

  /** Arbitrary extra fields you may want to attach */
  customFields?: Record<string, any>;

  /** IDs of AssessmentTypes automatically linked to this appointment */
  assessmentTypeIds?: string[];
}
