/**
 * LocationAdminPayload
 * --------------------------------------------------------------------------
 * Single-location admin.  If you later allow multi-location admins, swap the
 * field to an array.
 */
export interface LocationAdminPayload {
  email: string;
  firstName?: string;
  lastName?: string;

  /** Location they administer */
  serviceLocationId: string;

  permissions?: string[];
}
