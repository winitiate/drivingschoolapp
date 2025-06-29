/*  userLifecycle.types.ts  */

/** Roles for which a single-location life-cycle change makes sense */
export type LifecycleRole =
  | "client"
  | "serviceProvider"
  | "locationAdmin"
  | "businessOwner";

/** Actions the UI can request **/
export type LifecycleAction =
  | "ban"
  | "deactivate"
  | "reactivate"
  | "delete";      // remove relationship; may disable Auth user if last role

export interface SetUserLifecycleInput {
  uid:        string;             // target Firebase-Auth UID
  role:       LifecycleRole;      // one of the above
  locationId: string;             // serviceLocationId OR businessId
  action:     LifecycleAction;
  msg?:       string;             // optional ban/deactivate message
}

export interface SetUserLifecycleResult {
  success: true;
}
