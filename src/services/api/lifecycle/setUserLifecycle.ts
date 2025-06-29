/*  src/services/api/lifecycle/setUserLifecycle.ts
    ------------------------------------------------
    Callable wrapper for functions-users:setUserLifecycle
*/

import { httpsCallable } from "firebase/functions";
import { functions }     from "../../../firebase";

/* ----- Types -------------------------------------------------------- */
export type LifecycleRole =
  | "client"
  | "serviceProvider"
  | "locationAdmin"
  | "businessOwner";

export type LifecycleAction =
  | "ban"
  | "deactivate"
  | "reactivate"
  | "delete";

export interface SetUserLifecycleInput {
  uid: string;            // Auth UID of the target
  role: LifecycleRole;    // which relationship to touch
  locationId: string;     // scope (service-location id)
  action: LifecycleAction;
  msg?: string;           // optional ban/deactivate message
}

export interface SetUserLifecycleResult {
  success: boolean;
}

/* ----- Wrapper ------------------------------------------------------ */
export async function setUserLifecycle(
  data: SetUserLifecycleInput
): Promise<SetUserLifecycleResult> {
  const callable = httpsCallable<
    SetUserLifecycleInput,
    SetUserLifecycleResult
  >(functions, "setUserLifecycle");

  const res = await callable(data);
  return res.data;
}
