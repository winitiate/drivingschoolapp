/**
 * ClientPayload
 * --------------------------------------------------------------------------
 * Basic end-user profile.  Client-specific data goes to `customFields`.
 */
export interface ClientPayload {
  email: string;
  firstName?: string;
  lastName?: string;

  /** Locations they book at */
  clientLocationIds: string[];

  customFields?: Record<string, any>;
}
