// functions-users/src/handlers/createBusinessOwner.handler.ts

import { onCall } from "firebase-functions/v2/https";
import { HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { createBusinessOwnerService } from "../services/businessOwner.service";
import type { CreateBusinessOwnerInput, CreateBusinessOwnerResult } from "../types/businessOwner.types";

export const createBusinessOwner = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<CreateBusinessOwnerInput>
  ): Promise<CreateBusinessOwnerResult> => {
    const data = req.data;

    if (!data?.email) {
      throw new HttpsError("invalid-argument", "Missing required field: email");
    }

    try {
      return await createBusinessOwnerService(data);
    } catch (err: any) {
      console.error("createBusinessOwner error:", err);
      throw new HttpsError("internal", err.message || "Failed to create business owner");
    }
  }
);
