import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import {
  createServiceProviderService,
} from "../services/serviceProvider.service";
import type {
  CreateServiceProviderInput,
  CreateServiceProviderResult,
} from "../types/serviceProvider.types";

export const createServiceProvider = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (
    req: CallableRequest<CreateServiceProviderInput>
  ): Promise<CreateServiceProviderResult> => {
    const data = req.data;

    if (!data?.email) {
      throw new HttpsError("invalid-argument", "Missing required field: email");
    }
    if (!Array.isArray(data.providerLocationIds) || !data.providerLocationIds.length) {
      throw new HttpsError("invalid-argument", "providerLocationIds must be a non-empty array");
    }

    try {
      return await createServiceProviderService(data);
    } catch (err: unknown) {
      console.error("createServiceProvider error:", err);
      throw new HttpsError("internal", (err as any)?.message || "Failed to create service provider");
    }
  }
);
