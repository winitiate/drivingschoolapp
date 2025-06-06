// functions/src/subscriptions/squareWebhook.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Import Square webhook utilities via require to avoid missing TS exports
const { WebhookEvent, WebhookSignature } = require("square");
import { decrypt } from "../utils/encryption"; // adjust path if needed

const db = admin.firestore();

const CREDENTIALS_COLLECTION = "paymentCredentials";
const USERS_COLLECTION = "users";
const SUBSCR_COLLECTION = "subscriptions";

/**
 * HTTP endpoint to receive Square webhook events.
 * It verifies the signature, then handles subscription‐related events:
 *   • subscription.created
 *   • subscription.updated
 *   • subscription.canceled
 * (Optionally: invoice.payment_succeeded, etc.)
 */
export const squareWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // 1) Read raw body (we’ll use it to verify the signature)
    const body = req.rawBody.toString();

    // 2) Fetch encrypted Square webhook signature key from Firestore
    const credSnap = await db
      .collection(CREDENTIALS_COLLECTION)
      .where("provider", "==", "square")
      .where("ownerType", "==", "platform")
      .limit(1)
      .get();
    if (credSnap.empty) {
      throw new Error("Square credentials not configured");
    }
    const credData = credSnap.docs[0].data() as any;
    const webhookKeyEncrypted = credData.credentials.webhookSignatureKey as string;
    const webhookKey = decrypt(webhookKeyEncrypted);

    // 3) Validate the signature using Square’s utility
    if (
      !WebhookSignature.isValidWebhookEventSignature(
        webhookKey,
        req.headers,
        body
      )
    ) {
      console.error("Invalid Square webhook signature");
      res.status(400).send("Invalid signature");
      return;
    }

    // 4) Deserialize the event
    const event = WebhookEvent.deserialize(JSON.parse(body));
    const eventType = event.eventType;

    switch (eventType) {
      case "subscription.created": {
        const data = event.data as any;
        const subscription = data.object.subscription;
        const subscriptionId = subscription.id;
        const customerId = subscription.customerId;

        // Look up Firebase UID by squareCustomerId
        const userQuery = await db
          .collection(USERS_COLLECTION)
          .where("squareCustomerId", "==", customerId)
          .limit(1)
          .get();
        if (!userQuery.empty) {
          const uid = userQuery.docs[0].id;
          await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).set({
            businessId: uid,
            planId: subscription.planId,
            squareSubscriptionId: subscriptionId,
            status: subscription.status,
            startDate: subscription.startDate,
            version: subscription.version,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case "subscription.updated": {
        const data = event.data as any;
        const subscription = data.object.subscription;
        const subscriptionId = subscription.id;
        await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).update({
          status: subscription.status,
          version: subscription.version,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      case "subscription.canceled": {
        const data = event.data as any;
        const subscription = data.object.subscription;
        const subscriptionId = subscription.id;
        await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).update({
          status: "CANCELED",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      // (Optionally handle invoice.payment_succeeded, etc.)

      default:
        console.log("Unhandled Square event type:", eventType);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("squareWebhook error:", error);
    res.status(400).send(`Error: ${error.message}`);
  }
});
