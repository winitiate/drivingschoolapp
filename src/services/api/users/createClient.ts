/**
 * createClient.ts
 * --------------------------------------------------------------------------
 * Front-end wrapper for the Cloud Function **createClient**.
 *
 * Usage example:
 *   import { createClient } from "../../services";
 *
 *   const result = await createClient({
 *     email:             "jane.doe@example.com",
 *     firstName:         "Jane",
 *     lastName:          "Doe",
 *     clientLocationIds: ["e2399611-1b47-42c7-aad4-e298c345fa98"],
 *   });
 */

import { httpsCallable } from "firebase/functions";
// ⬇⬇ Adjusted relative path to shared Firebase client ⬇⬇
import { functions } from "../../../firebase";

export interface CreateClientInput {
  email: string;
  firstName?: string;
  lastName?: string;
  clientLocationIds: string[];
  customFields?: Record<string, any>;
}

export interface CreateClientResult {
  success: boolean;
  clientId: string;
  userUid: string;
}

export async function createClient(
  data: CreateClientInput
): Promise<CreateClientResult> {
  const fn = httpsCallable<CreateClientInput, CreateClientResult>(
    functions,
    "createClient"
  );
  const res = await fn(data);
  return res.data;
}
