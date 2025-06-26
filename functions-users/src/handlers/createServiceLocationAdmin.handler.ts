import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import { requireString } from "../utils/validateRequest";
import { createLocationAdmin } from "../services/locationAdmin.service";
import { LocationAdminPayload } from "../types/locationAdmin.types";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const p = req.body as LocationAdminPayload;
    requireString("email", p.email);
    requireString("serviceLocationId", p.serviceLocationId);

    const out = await createLocationAdmin(p);
    res.json(out);
  } catch (err: any) {
    console.error("createServiceLocationAdmin error", err);
    res
      .status(err.httpErrorCode?.status || 500)
      .json({ error: err.message });
  }
});

export const createServiceLocationAdmin = onRequest(
  { region: "us-central1" },
  app
);
