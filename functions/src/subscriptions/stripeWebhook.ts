// functions/src/subscriptions/stripeWebhook.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { decrypt } from "../utils/encryption"; // Adjust this path if needed

const db = admin.firestore();

const CREDENTIALS_COLLECTION = "paymentCredentials";
const USERS_COLLECTION = "users";
const SUBSCR_COLLECTION = "subscriptions";

/**
 * HTTP endpoint to receive Stripe webhook events.
 * It verifies the signature, then handles subscription‐related events:
 *   • checkout.session.completed
 *   • invoice.paid
 *   • customer.subscription.updated
 *   • customer.subscription.deleted
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const rawBody = req.rawBody;
  const sig = req.headers["stripe-signature"] as string;

  try {
    // 1) Fetch encrypted Stripe webhook secret + API secret from Firestore
    const credSnap = await db
      .collection(CREDENTIALS_COLLECTION)
      .where("provider", "==", "stripe")
      .where("ownerType", "==", "platform")
      .limit(1)
      .get();
    if (credSnap.empty) {
      throw new Error("Stripe credentials not configured");
    }
    const credData = credSnap.docs[0].data() as any;
    const webhookSecEnc = credData.credentials.webhookSecret as string;
    const stripeSecretEnc = credData.credentials.secretKey as string;

    const webhookSecret = decrypt(webhookSecEnc);
    const stripeSecretKey = decrypt(stripeSecretEnc);

    // 2) Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-05-28.basil",
    });

    // 3) Verify and parse the incoming event
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // 4) Handle event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = (session as any).subscription as string; // snake_case

        // Look up the Firebase UID by stripeCustomerId
        const userQuery = await db
          .collection(USERS_COLLECTION)
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();
        if (!userQuery.empty && subscriptionId) {
          const uid = userQuery.docs[0].id;

          // Build the Firestore subscription document
          const subDoc: any = {
            businessId: uid,
            planId: session.metadata?.planId || "",
            stripeSubscriptionId: subscriptionId,
            status: "active",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Extract snake_case period fields if present
          const subscriptionObj = (session as any).subscription as any;
          if (
            subscriptionObj &&
            subscriptionObj.current_period_start != null &&
            subscriptionObj.current_period_end != null
          ) {
            subDoc.currentPeriodStart = admin.firestore.Timestamp.fromMillis(
              subscriptionObj.current_period_start * 1000
            );
            subDoc.currentPeriodEnd = admin.firestore.Timestamp.fromMillis(
              subscriptionObj.current_period_end * 1000
            );
          }

          await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).set(subDoc);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string; // snake_case
        if (subscriptionId) {
          await db
            .collection(SUBSCR_COLLECTION)
            .doc(subscriptionId)
            .update({
              status: "active",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const subscriptionAny = subscription as any; // to access snake_case fields

        const updates: any = {
          status: subscription.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (
          subscriptionAny.current_period_start != null &&
          subscriptionAny.current_period_end != null
        ) {
          updates.currentPeriodStart = admin.firestore.Timestamp.fromMillis(
            subscriptionAny.current_period_start * 1000
          );
          updates.currentPeriodEnd = admin.firestore.Timestamp.fromMillis(
            subscriptionAny.current_period_end * 1000
          );
        }
        await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).update(updates);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("⚠ Stripe webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
