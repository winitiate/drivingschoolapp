// functions/src/subscriptions/stripeWebhook.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { decrypt } from "../utils/encryption"; // adjust path if needed

admin.initializeApp();
const db = admin.firestore();

const CREDENTIALS_COLLECTION = "paymentCredentials";
const USERS_COLLECTION = "users";
const SUBSCR_COLLECTION = "subscriptions";

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const rawBody = req.rawBody;
  const sig = req.headers["stripe-signature"] as string;

  try {
    // 1) Fetch and decrypt the Stripe webhook secret
    const credSnap = await db
      .collection(CREDENTIALS_COLLECTION)
      .where("provider", "==", "stripe")
      .where("ownerType", "==", "platform")
      .limit(1)
      .get();
    if (credSnap.empty) throw new Error("Stripe credentials not configured");

    const credData = credSnap.docs[0].data() as any;
    const webhookSecEnc = credData.credentials.webhookSecret;
    const webhookSecret = decrypt(webhookSecEnc);

    // 2) Initialize Stripe with the decrypted secret key
    const stripe = new Stripe(decrypt(credData.credentials.secretKey), {
      apiVersion: "2022-11-15",
    });

    // 3) Verify the incoming event
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // 4) Handle relevant Stripe event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Find the Firebase UID associated with this Stripe customer
        const userQuery = await db
          .collection(USERS_COLLECTION)
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();
        if (!userQuery.empty) {
          const uid = userQuery.docs[0].id;

          // Create a Firestore subscription record
          await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).set({
            businessId: uid,
            planId: session.metadata?.planId || "", // if you passed planId in metadata
            stripeSubscriptionId: subscriptionId,
            status: "active",
            currentPeriodStart: admin.firestore.Timestamp.fromMillis(
              (session.subscription as any).current_period_start * 1000
            ),
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
              (session.subscription as any).current_period_end * 1000
            ),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        await db.collection(SUBSCR_COLLECTION).doc(subscriptionId).update({
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.collection(SUBSCR_COLLECTION).doc(subscription.id).update({
          status: subscription.status,
          currentPeriodStart: admin.firestore.Timestamp.fromMillis(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
            subscription.current_period_end * 1000
          ),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("⚠ Stripe webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
