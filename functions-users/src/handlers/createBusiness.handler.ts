/**
 * createBusiness.handler.ts  — HTTPS onRequest (v2)
 */
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import { requireString } from "../utils/validateRequest";
import {
  BusinessPayload,
  createBusinessDoc,
} from "../services/business.service";

/* Build an Express app so you can extend later (middleware, etc.) */
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const p = req.body as BusinessPayload;
    requireString("name", p.name);
    requireString("ownerEmail", p.ownerEmail);

    const out = await createBusinessDoc(p);
    res.json(out);
  } catch (err: any) {
    console.error("createBusiness error", err);
    res.status(err.httpErrorCode?.status || 500).json({ error: err.message });
  }
});

/**
 * Export Cloud Function (v2).  First arg = options object, second = handler.
 * Region, cors, memory, timeout, etc. all go inside that options object.
 */
export const createBusiness = onRequest(
  { region: "us-central1" },
  app
);
