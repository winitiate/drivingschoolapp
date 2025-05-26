// src/data/FirestoreBusinessSettingsStore.ts

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp
} from "firebase/firestore";
import { BusinessSettings } from "../models/BusinessSettings";
import { BusinessSettingsStore } from "./BusinessSettingsStore";

export class FirestoreBusinessSettingsStore implements BusinessSettingsStore {
  private db = getFirestore();
  private coll = collection(this.db, "businessSettings");

  async getByBusinessId(businessId: string): Promise<BusinessSettings | null> {
    const ref = doc(this.coll, businessId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as BusinessSettings) };
  }

  async save(settings: BusinessSettings): Promise<void> {
    const now = Timestamp.now();
    const ref = doc(this.coll, settings.businessId);
    await setDoc(
      ref,
      {
        ...settings,
        createdAt: settings.createdAt || now,
        updatedAt: now
      },
      { merge: true }
    );
  }
}
