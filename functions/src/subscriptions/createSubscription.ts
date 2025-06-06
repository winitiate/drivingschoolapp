// functions/src/subscriptions/createSubscription.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { decrypt } from "../utils/encryption"; // adjust if your path differs

admin.initializeApp();
const db = admin.firestore();

const CREDENTIALS_COLLECTION = "paymentCredentials";
const PACKAGES_COLLECTION = "servicePackages";
const USERS_COLLECTION = "users";

export const createSubscription = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send({ error: "Method not allowed" });
      return;
    }

    try {
      const { uid, planId } = req.body as { uid: string; planId: string };
      if (!uid || !planId) throw new Error("Missing uid or planId");

      // 1) Fetch Stripe credentials (provider="stripe", ownerType="platform")
      const credSnap = await db
        .collection(CREDENTIALS_COLLECTION)
        .where("provider", "==", "stripe")
        .where("ownerType", "==", "platform")
        .limit(1)
        .get();
      if (credSnap.empty) throw new Error("Stripe credentials not configured");

      const credData = credSnap.docs[0].data() as any;
      const stripeSecretEncrypted = credData.credentials.secretKey;
      const stripeSecretKey = decrypt(stripeSecretEncrypted);

      // 2) Initialize Stripe
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2022-11-15",
      });

      // 3) Fetch the ServicePackage from Firestore
      const planDoc = await db.collection(PACKAGES_COLLECTION).doc(planId).get();
      if (!planDoc.exists) throw new Error("Plan not found");

      const planData = planDoc.data()!;
      const stripePriceId = (planData as any).stripePriceId as string;
      if (!stripePriceId) throw new Error("Plan missing stripePriceId");

      // 4) Look up or create a Stripe Customer for this Firebase UID
      const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) throw new Error("User record not found");

      const userData = userDoc.data() as any;
      let customerId = userData.stripeCustomerId as string | undefined;
      if (!customerId) {
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

      res.json({ sessionUrl: session.url });
    } catch (e: any) {
      console.error("createSubscription error:", e);
      res.status(400).send({ error: e.message });
    }
  }
);
