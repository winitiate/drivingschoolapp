/**
 * webhookHandler.ts
 *
 * Firebase v2 HTTP Function for Square webhooks:
 * - Handles CORS preflight
 * - Logs the incoming payload
 * - Responds with { success: true }
 */
import { onRequest } from "firebase-functions/v2/https";

export const webhookHandler = onRequest({ cors: true }, (req, res) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  console.log("Square webhook received:", JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});
