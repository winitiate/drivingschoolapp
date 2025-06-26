import express from "express";
import cors from "cors";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { requireString } from "../utils/validateRequest";
import {
  assertSelfRegAllowed,
  SelfRegRole,
} from "../utils/selfReg.utils";
import {
  createClient as createClientService,
} from "../services/client.service";
import { ClientPayload } from "../types/client.types";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const p = req.body as ClientPayload;
    requireString("email", p.email);

    if (!Array.isArray(p.clientLocationIds) || p.clientLocationIds.length === 0) {
      throw new HttpsError("invalid-argument", "clientLocationIds[] required");
    }

    await assertSelfRegAllowed("client", p.clientLocationIds);

    const out = await createClientService(p);
    res.json(out);
  } catch (err: any) {
    console.error("createClient error", err);
    res.status(err.httpErrorCode?.status || 500).json({ error: err.message });
  }
});

export const createClient = onRequest({ region: "us-central1" }, app);
