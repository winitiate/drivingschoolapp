/**
 * selfReg.utils.ts  (Cloud Functions side)
 * --------------------------------------------------------------------------
 * Throws if self-registration is disabled for the given `role`
 * at any of the specified service-location IDs.
 *
 * Resolution order (per location):
 *   1. serviceLocations/{id}.selfRegister[role]    ← explicit override
 *   2. businesses/{bizId}.selfRegister[role]       ← business default
 *   3. Missing / false → rejection
 */

import { db } from "../clients/firebaseAdmin.client";

/** Role strings accepted by this guard */
export type SelfRegRole = "client" | "provider" | "locationAdmin" | "owner";

interface SelfRegisterSettings {
  owner?: boolean;
  locationAdmin?: boolean;
  provider?: boolean;
  client?: boolean;
}
interface ServiceLocationDoc {
  name?: string;
  businessId: string;
  selfRegister?: SelfRegisterSettings;
}
interface BusinessDoc {
  name?: string;
  selfRegister?: SelfRegisterSettings;
}

export async function assertSelfRegAllowed(
  role: SelfRegRole,
  locationIds: string[]
): Promise<void> {
  for (const locationId of locationIds) {
    /* ───────── 1. Load location ───────── */
    const locSnap = await db.collection("serviceLocations").doc(locationId).get();
    if (!locSnap.exists) {
      throw new Error(`Unknown service location ${locationId}`);
    }
    const loc = locSnap.data() as ServiceLocationDoc;

    const locSetting = loc.selfRegister?.[role];
    if (locSetting === false) {
      throw new Error(
        `Self-registration for ${role}s disabled at location “${loc.name || locationId}”.`
      );
    }
    if (locSetting === true) continue; // allowed for this location

    /* ───────── 2. Fallback to business default ───────── */
    const bizSnap = await db.collection("businesses").doc(loc.businessId).get();
    const biz = bizSnap.exists ? (bizSnap.data() as BusinessDoc) : null;

    const bizSetting = biz?.selfRegister?.[role];
    if (bizSetting !== true) {
      throw new Error(
        `Self-registration for ${role}s disabled for business “${biz?.name || loc.businessId}”.`
      );
    }
    // else allowed → loop continues to next location
  }
}
