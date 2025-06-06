// src/data/FirestoreSubscriptionStore.ts

import {
  getDocs,
  query,
  where,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Subscription } from "../models/Subscription";
import type { SubscriptionStore } from "./SubscriptionStore";

const SUBSCR_COLLECTION = "subscriptions";

export class FirestoreSubscriptionStore implements SubscriptionStore {
  private colRef = collection(db, SUBSCR_COLLECTION);

  /** Fetch a subscription by its Stripe subscription ID (doc ID) */
  async getById(id: string): Promise<Subscription | null> {
    const docRef = doc(this.colRef, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      id: snap.id,
      businessId: data.businessId,
      planId: data.planId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart?.toDate(),
      currentPeriodEnd: data.currentPeriodEnd?.toDate(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /** Fetch the active subscription for a given business UID */
  async getByBusinessId(businessId: string): Promise<Subscription | null> {
    const q = query(this.colRef, where("businessId", "==", businessId));
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const docSnap = snaps.docs[0];
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      businessId: data.businessId,
      planId: data.planId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart?.toDate(),
      currentPeriodEnd: data.currentPeriodEnd?.toDate(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /** Save or update a subscription (used by webhooks) */
  async save(subscription: Subscription): Promise<void> {
    const now = Timestamp.now();
    const payload: any = {
      businessId: subscription.businessId,
      planId: subscription.planId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status,
      updatedAt: now,
      currentPeriodStart: subscription.currentPeriodStart
        ? Timestamp.fromDate(subscription.currentPeriodStart)
        : null,
      currentPeriodEnd: subscription.currentPeriodEnd
        ? Timestamp.fromDate(subscription.currentPeriodEnd)
        : null,
      ...(subscription.id ? {} : { createdAt: now }),
    };

    if (subscription.id) {
      await updateDoc(doc(this.colRef, subscription.id), payload);
    } else {
      const newRef = doc(this.colRef);
      await setDoc(newRef, payload);
    }
  }
}
