/**
 * ProviderPayload
 * --------------------------------------------------------------------------
 * Minimal required fields to stand up a service provider.  Everything else
 * (e.g. licences, vehicleCerts) should live under `customFields`.
 */
export interface ProviderPayload {
  /** Primary login / invite address */
  email: string;

  /** First & last shown in roster (optional) */
  firstName?: string;
  lastName?: string;

  /** Locations they can serve — must include at least one */
  providerLocationIds: string[];

  /** Free-form extras; use any key you need */
  customFields?: Record<string, any>;
}
