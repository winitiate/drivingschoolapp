/**
 * functions-invites/src/index.ts
 *
 * Barrel file for the Invites codebase.
 * Exports each Cloud Function so that firebase-tools
 * can discover and deploy them as individual endpoints.
 */

import { createInvite } from "./handlers/createInvite";
import { acceptInvite } from "./handlers/acceptInvite";

// Export functions by name:
export {
  createInvite,
  acceptInvite,
};
