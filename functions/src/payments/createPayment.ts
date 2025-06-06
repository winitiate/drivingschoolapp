// functions/src/payments/createPayment.ts

import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
// Import Square SDK via require to avoid missing TS exports
const { Client: SquareClient, Environment } = require("square");
import { v4 as uuid } from "uuid";
import { decrypt } from "../utils/encryption"; // adjust path if necessary

/**
 * We assume you have a Firestore document under:
 *   paymentCredentials → { provider: "square", ownerType: "platform", ... }
 * containing:
 *   credentials: {
 *     accessToken: "<encrypted_square_access_token>",
 *     webhookSignatureKey: "<encrypted_square_webhook_signature_key>"
 *   }
 * and that you have a utility `decrypt(...)` to decrypt the stored value.
 */

interface ReqBody {
  appointmentId:     string;             // ← pass the appointment document ID
  ownerType:         "serviceLocation" | "business" | "serviceProvider";
  ownerId:           string;
  appointmentTypeId: string;
  amountCents:       number;
  nonce:             string;             // Square card nonce from frontend
  saveCardOnFile?:   boolean;            // ← optional flag
}

interface PaymentResult {
  paymentId:      string;
  status:         "COMPLETED" | "PENDING";
  receiptUrl?:    string;
  feesCents?:     number;
  netTotalCents?: number;
  cardBrand?:     string;
  panSuffix?:     string;
  detailsUrl?:    string;
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
  const {
    appointmentId,
    ownerType,
    ownerId,
    appointmentTypeId,
    amountCents,
    nonce,
    saveCardOnFile = false,
  } = body;

  if (
    !appointmentId ||
    !ownerType ||
    !ownerId ||
    !appointmentTypeId ||
    typeof amountCents !== "number" ||
    !nonce
  ) {
    res.status(400).json({ error: "Missing or invalid field" });
    return;
  }

  // 1️⃣ Fetch your Square access token from Firestore
  const db = getFirestore();
  const credSnap = await db
    .collection("paymentCredentials")
    .where("provider", "==", "square")
    .where("ownerType", "==", "platform")
    .limit(1)
    .get();

  if (credSnap.empty) {
    res.status(500).json({ error: "Square credentials not configured" });
    return;
  }
  const credData = credSnap.docs[0].data() as any;
  const squareAccessToken = decrypt(credData.credentials.accessToken as string);

  // 2️⃣ Initialize Square client
  const squareClient = new SquareClient({
    environment: Environment.Production, // or Environment.Sandbox for testing
    accessToken: squareAccessToken,
  });

  // 3️⃣ Optionally: create or fetch a Square Customer & save the card on file
  let cardIdOnFile: string | null = null;
  let customerId: string | undefined = undefined;

  if (saveCardOnFile) {
    // a) Determine a Firestore user doc for this “ownerType/ownerId”.
    //    Here we assume ownerId is the Firebase UID; adjust if your mapping differs.
    const firebaseUid = ownerId;

    // b) Fetch or create a Square Customer for that user
    const userDocRef = db.collection("users").doc(firebaseUid);
    const userSnap = await userDocRef.get();
    if (!userSnap.exists) {
      res.status(500).json({ error: "User record not found for saving card" });
      return;
    }
    const userData = userSnap.data() as any;

    if (userData.squareCustomerId) {
      customerId = userData.squareCustomerId as string;
    } else {
      // Create a new Square Customer
      const customerResp = await squareClient.customersApi.createCustomer({
        emailAddress: userData.email,
        referenceId:  firebaseUid,
      });
      if (
        customerResp.statusCode !== 200 ||
        !customerResp.result.customer
      ) {
        res.status(500).json({ error: "Failed to create Square customer" });
        return;
      }
      customerId = customerResp.result.customer.id;
      await userDocRef.set({ squareCustomerId: customerId }, { merge: true });
    }

    // c) Attach the cardNonce to that Customer
    const createCardResponse = await squareClient.cardsApi.createCard({
      idempotencyKey: `${firebaseUid}-${Date.now()}`,
      sourceId:       nonce,        // the tokenized card from front end
      card: {
        customerId:    customerId,
        // Optionally, you can pass billingAddress or cardholderName here
      },
    });
    if (
      createCardResponse.statusCode !== 200 ||
      !createCardResponse.result.card
    ) {
      res.status(500).json({ error: "Failed to save card on file" });
      return;
    }
    cardIdOnFile = createCardResponse.result.card.id;

    // d) Keep a record of cardId in Firestore for future reference:
    await userDocRef.set(
      {
        squareCards: admin.firestore.FieldValue.arrayUnion(cardIdOnFile),
      },
      { merge: true }
    );
  }

  // 4️⃣ Charge the card: either the newly saved cardId, or the cardNonce directly
  let paymentResult: PaymentResult;
  try {
    const createPaymentRequest: any = {
      sourceId:    saveCardOnFile && cardIdOnFile ? cardIdOnFile : nonce,
      idempotencyKey: uuid(),
      amountMoney: {
        amount:   amountCents,
        currency: "USD",
      },
      // If you want to record which customer was charged:
      // customerId: saveCardOnFile ? customerId : undefined,
    };

    // If charging a saved card, explicitly include the customerId
    if (saveCardOnFile && cardIdOnFile && customerId) {
      createPaymentRequest.customerId = customerId;
    }

    const resp = await squareClient.paymentsApi.createPayment(createPaymentRequest);
    if (resp.statusCode !== 200 || !resp.result.payment) {
      throw new Error("Failed to create payment");
    }

    const payment = resp.result.payment;
    paymentResult = {
      paymentId:      payment.id,
      status:         payment.status as "COMPLETED" | "PENDING",
      receiptUrl:     payment.receiptUrl ?? undefined,
      feesCents:      payment.processingFee?.[0]?.amountMoney.amount,
      netTotalCents:  payment.amountMoney.amount - (payment.processingFee?.[0]?.amountMoney.amount ?? 0),
      cardBrand:      payment.cardDetails?.card?.cardBrand,
      panSuffix:      payment.cardDetails?.card?.last4,
      detailsUrl:     payment.cardDetails?.card?.digitalWallet,
    };
  } catch (err: any) {
    console.error("Square createPayment error:", err);
    res.status(500).json({ error: err.message || "Payment failed" });
    return;
  }

  // 5️⃣ Write the payment metadata into Firestore under the appointment
  try {
    const apptRef = db.collection("appointments").doc(appointmentId);

    // Store paymentId, amountCents, and optionally saved cardId
    const updateData: any = {
      "metadata.paymentId":    paymentResult.paymentId,
      "metadata.amountCents":  amountCents,
    };
    if (cardIdOnFile) {
      updateData["metadata.savedCardId"] = cardIdOnFile;
    }
    await apptRef.set(updateData, { merge: true });
  } catch (err: any) {
    console.error("Error writing appointment metadata:", err);
    // Do not fail the entire request if Firestore write fails—log and continue
  }

  // 6️⃣ Respond with success and the payment details
  res.json({ success: true, payment: paymentResult });
});
