/**
 * createServiceProvider.ts
 * --------------------------------------------------------------------------
 * Front-end wrapper for the Cloud Function **createServiceProvider**.
 *
 * Usage:
 *   import { createServiceProvider } from "../../services";
 *
 *   const result = await createServiceProvider({
 *     email:                "doc@example.com",
 *     firstName:            "Doc",
 *     lastName:             "Brown",
 *     providerLocationIds:  ["e2399611-1b47-42c7-aad4-e298c345fa98"],
 *     customFields:         { licenseNumber: "12345" },
 *   });
 */

import { httpsCallable } from "firebase/functions";
// ▲▲▲ firebase/functions is fine.  ▼▼▼ path to your firebase.ts **must** climb three levels.
import { functions } from "../../../firebase";

export interface CreateServiceProviderInput {
  email: string;
  firstName?: string;
  lastName?: string;
  providerLocationIds: string[];
  customFields?: Record<string, any>;
}

export interface CreateServiceProviderResult {
  success: boolean;
  providerId: string;
  userUid: string;
}

export async function createServiceProvider(
  data: CreateServiceProviderInput
): Promise<CreateServiceProviderResult> {
  const fn = httpsCallable<
    CreateServiceProviderInput,
    CreateServiceProviderResult
  >(functions, "createServiceProvider");

  const res = await fn(data);
  return res.data;
}
