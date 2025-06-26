/**
 * createServiceLocationAdmin.ts
 * --------------------------------------------------------------------------
 * Front-end wrapper for the Cloud Function **createServiceLocationAdmin**.
 *
 * Usage:
 *   import { createServiceLocationAdmin } from "../../services";
 *
 *   const result = await createServiceLocationAdmin({
 *     email:              "manager@example.com",
 *     firstName:          "Mary",
 *     lastName:           "Manager",
 *     serviceLocationId:  "e2399611-1b47-42c7-aad4-e298c345fa98",
 *     permissions:        ["schedule:write"],
 *   });
 */

import { httpsCallable } from "firebase/functions";
// Correct path to shared Firebase client:
import { functions } from "../../../firebase";

export interface CreateServiceLocationAdminInput {
  email: string;
  firstName?: string;
  lastName?: string;
  serviceLocationId: string;
  permissions?: string[];
}

export interface CreateServiceLocationAdminResult {
  success: boolean;
  locationAdminId: string;
  userUid: string;
}

export async function createServiceLocationAdmin(
  data: CreateServiceLocationAdminInput
): Promise<CreateServiceLocationAdminResult> {
  const fn = httpsCallable<
    CreateServiceLocationAdminInput,
    CreateServiceLocationAdminResult
  >(functions, "createServiceLocationAdmin");

  const res = await fn(data);
  return res.data;
}
