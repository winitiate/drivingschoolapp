import { onRequest } from "firebase-functions/v2/https";

export const updates = onRequest({ cors: true }, (req, res) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  // Log incoming Square webhook payload
  console.log("Square webhook:", JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});
