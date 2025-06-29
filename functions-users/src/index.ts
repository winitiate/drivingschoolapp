/**
 * functions-users/index.ts  – export every CF exactly once
 */

/* ── On-boarding & CRUD ── */
export { createBusiness              } from "./handlers/createBusiness.handler";
export { onBusinessWrite             } from "./handlers/onBusinessWrite.handler";
export { onInviteWrite               } from "./handlers/onInviteWrite.handler";

export { createServiceProvider       } from "./handlers/createServiceProvider.handler";
export { createClient                } from "./handlers/createClient.handler";
export { createServiceLocationAdmin  } from "./handlers/createServiceLocationAdmin.handler";
export { createBusinessOwner         } from "./handlers/createBusinessOwner.handler";

/* ── Life-cycle controls ── */
export { setUserLifecycle            } from "./handlers/setUserLifecycle.handler";

/* ── Invite callables ── */
export { createInvite                } from "./handlers/createInvite";
export { acceptInvite                } from "./handlers/acceptInvite";
