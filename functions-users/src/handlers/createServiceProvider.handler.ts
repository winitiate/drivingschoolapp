import express from "express";
import cors from "cors";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { requireString } from "../utils/validateRequest";
import {
  assertSelfRegAllowed,
  SelfRegRole,
} from "../utils/selfReg.utils";
import { createProvider } from "../services/provider.service";
import { ProviderPayload } from "../types/provider.types";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const p = req.body as ProviderPayload;
    requireString("email", p.email);

    if (
      !Array.isArray(p.providerLocationIds) ||
      p.providerLocationIds.length === 0
    ) {
      throw new HttpsError("invalid-argument", "providerLocationIds[] required");
    }

    await assertSelfRegAllowed("provider", p.providerLocationIds);

    const out = await createProvider(p);
    res.json(out);
  } catch (err: any) {
    console.error("createServiceProvider error", err);
    res.status(err.httpErrorCode?.status || 500).json({ error: err.message });
  }
});

export const createServiceProvider = onRequest(
  { region: "us-central1" },
  app
);
