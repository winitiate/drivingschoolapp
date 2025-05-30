// functions\payments\createPayment.ts
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

export const createPayment = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("POST only");

  const {
    ownerType,
    ownerId,
    appointmentTypeId,
    amountCents,
    nonce,
  } = req.body as ReqBody;

  if (!nonce || !amountCents) return res.status(400).send("Bad request");

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
    return res.json(result);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});
