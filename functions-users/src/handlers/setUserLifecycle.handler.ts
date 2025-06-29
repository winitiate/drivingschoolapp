/**
 * setUserLifecycle.handler.ts   –  HTTPS **v2** callable
 * ------------------------------------------------------------------
 *  • Validates auth
 *  • Delegates to userLifecycleService
 *  • Export name MUST be *setUserLifecycle* so the function is
 *    deployed at  https://…cloudfunctions.net/**setUserLifecycle**
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { userLifecycleService } from "../services/userLifecycle.service";

import type {
  SetUserLifecycleInput,
  SetUserLifecycleResult,
} from "../types/userLifecycle.types";

export const setUserLifecycle = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<SetUserLifecycleInput>
  ): Promise<SetUserLifecycleResult> => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    try {
      return await userLifecycleService(req.data, req.auth.uid);
    } catch (err: any) {
      console.error("[setUserLifecycle]", err);
      throw new HttpsError("internal", err?.message ?? "Lifecycle update failed.");
    }
  }
);
