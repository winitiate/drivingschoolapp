import { onRequest } from "firebase-functions/v2/https";
import { SquareGateway } from "./gateways/SquareGateway";
import { v4 as uuid } from "uuid";

interface ReqBody {
  ownerType: "serviceLocation" | "business" | "serviceProvider";
  ownerId: string;
  appointmentTypeId: string;
  amountCents: number;
  nonce: string;
}

export const createPayment = onRequest({ cors: true }, async (req, res) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  // Only POST allowed
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Validate body
  const body = req.body as Partial<ReqBody>;
  const { ownerType, ownerId, appointmentTypeId, amountCents, nonce } = body;
  if (
    !ownerType ||
    !ownerId ||
    !appointmentTypeId ||
    typeof amountCents !== "number" ||
    !nonce
  ) {
    res.status(400).json({ error: "Missing or invalid field" });
    return;
  }

  const gateway = new SquareGateway();
  try {
    const result = await gateway.createPayment({
      ownerType,
      ownerId,
      appointmentTypeId,
      amountCents,
      nonce,
      idempotencyKey: uuid(),
    });
    res.json({ success: true, payment: result });
  } catch (err: any) {
    console.error("createPayment error:", err);
    res.status(500).json({ error: err.message || "Internal Error" });
  }
});
