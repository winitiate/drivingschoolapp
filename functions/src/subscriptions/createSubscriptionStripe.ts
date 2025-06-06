// functions/src/subscriptions/createSubscriptionStripe.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { decrypt } from "../utils/encryption"; // Adjust this path if needed

const db = admin.firestore();

const CREDENTIALS_COLLECTION = "paymentCredentials";
const PACKAGES_COLLECTION = "servicePackages";
const USERS_COLLECTION = "users";

/**
 * HTTP endpoint to create a new Stripe Checkout Session for a subscription.
 * Expects POST JSON body: { uid: string, planId: string }
 * Responds with JSON: { sessionUrl: string }
 */
export const createSubscriptionStripe = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send({ error: "Method not allowed" });
      return;
    }

    try {
      const { uid, planId } = req.body as { uid: string; planId: string };
      if (!uid || !planId) {
        throw new Error("Missing uid or planId");
      }

      // 1) Fetch encrypted Stripe secret key from Firestore
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
      const stripeSecretEncrypted = credData.credentials.secretKey as string;
      const stripeSecretKey = decrypt(stripeSecretEncrypted);

      // 2) Initialize Stripe with a supported API version
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-05-28.basil",
      });

      // 3) Fetch the ServicePackage document from Firestore
      const planDoc = await db.collection(PACKAGES_COLLECTION).doc(planId).get();
      if (!planDoc.exists) {
        throw new Error("Plan not found");
      }
      const planData = planDoc.data()!;
      const stripePriceId = (planData as any).stripePriceId as string;
      if (!stripePriceId) {
        throw new Error("Plan is missing a stripePriceId");
      }

      // 4) Look up or create a Stripe Customer for this Firebase UID
      const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        throw new Error("User record not found");
      }
      const userData = userDoc.data() as any;

      let customerId: string;
      if (userData.stripeCustomerId) {
        customerId = userData.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: userData.email,
          metadata: { firebaseUid: uid },
        });
        customerId = customer.id;
        await userDocRef.set({ stripeCustomerId: customerId }, { merge: true });
      }

      // 5) Create a Stripe Checkout Session for a subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${req.headers.origin}/business/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/business/canceled`,
      });

      res.json({ sessionUrl: session.url! });
    } catch (error: any) {
      console.error("createSubscriptionStripe error:", error);
      res.status(400).send({ error: error.message });
    }
  }
);
