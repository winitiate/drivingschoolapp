// functions/src/subscriptions/createSubscriptionSquare.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Import Square SDK via require to avoid missing TS exports
const { Client: SquareClient, Environment } = require("square");
import { decrypt } from "../utils/encryption"; // Adjust this path if needed

const db = admin.firestore();

const CREDENTIALS_COLLECTION = "paymentCredentials";
const SUBSCR_COLLECTION = "subscriptions";
const USERS_COLLECTION = "users";

/**
 * HTTP endpoint to create a new Square subscription.
 * Expects POST JSON body: { uid: string, planId: string }
 *   - planId must match a Square catalog_object_id for a SUBSCRIPTION_PLAN
 * Returns: { subscriptionId: string }
 */
export const createSubscriptionSquare = functions.https.onRequest(
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

      // 1) Fetch encrypted Square access token from Firestore
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
      const squareAccessToken = decrypt(credData.credentials.accessToken as string);
      // webhookSignatureKey is used in squareWebhook.ts

      // 2) Initialize the Square client
      const squareClient = new SquareClient({
        environment: Environment.Production, // Change to Environment.Sandbox for testing
        accessToken: squareAccessToken,
      });

      // 3) Fetch the user’s email from Firestore to create a Square Customer
      const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        throw new Error("User record not found");
      }
      const userData = userDoc.data() as any;

      let customerId: string;
      if (userData.squareCustomerId) {
        customerId = userData.squareCustomerId;
      } else {
        // Create a new Square Customer
        const customersApi = squareClient.customersApi;
        const createCustomerResponse = await customersApi.createCustomer({
          emailAddress: userData.email,
          referenceId: uid,
        });
        if (
          createCustomerResponse.statusCode !== 200 ||
          !createCustomerResponse.result.customer
        ) {
          throw new Error("Failed to create Square customer");
        }
        customerId = createCustomerResponse.result.customer.id;
        await userDocRef.set({ squareCustomerId: customerId }, { merge: true });
      }

      // 4) Create a new Square Subscription
      //    planId here must be the catalog_object_id of a SUBSCRIPTION_PLAN in Square
      const createSubscriptionRequest = {
        idempotencyKey: `${uid}-${planId}-${Date.now()}`,
        locationId: "<YOUR_LOCATION_ID>", // ← REPLACE with your actual Square Location ID
        planId: planId,
        customerId: customerId,
        startDate: new Date().toISOString().split("T")[0], // e.g. "2025-06-20"
      };

      const subscriptionResponse =
        await squareClient.subscriptionsApi.createSubscription(
          createSubscriptionRequest
        );
      if (
        subscriptionResponse.statusCode !== 200 ||
        !subscriptionResponse.result.subscription
      ) {
        throw new Error("Failed to create Square subscription");
      }
      const subscription = subscriptionResponse.result.subscription;

      // 5) Save the new subscription in Firestore
      await db.collection(SUBSCR_COLLECTION).doc(subscription.id).set({
        businessId: uid,
        planId: planId,
        squareSubscriptionId: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        version: subscription.version,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ subscriptionId: subscription.id });
    } catch (error: any) {
      console.error("createSubscriptionSquare error:", error);
      res.status(400).send({ error: error.message });
    }
  }
);
