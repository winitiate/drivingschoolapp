/**
 * FirestoreBusinessStore.ts
 *
 * Concrete BusinessStore implementation using Firestore.
 * Persists the new `selfRegister` object transparently.
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";
import { Business } from "../models/Business";
import { BusinessStore } from "./BusinessStore";

const BUSINESSES_COLLECTION = "businesses";

export class FirestoreBusinessStore implements BusinessStore {
  private db = getFirestore();
  private collRef: CollectionReference = collection(
    this.db,
    BUSINESSES_COLLECTION
  );

  /* ─────────────────────────── CRUD ─────────────────────────── */

  async getById(id: string): Promise<Business | null> {
    const snap = await getDoc(doc(this.db, BUSINESSES_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Business) };
  }

  async listAll(): Promise<Business[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as Business) }));
  }

  async save(business: Business): Promise<void> {
    const now = Timestamp.now();

    /* Never write the plain `id` field into Firestore data */
    const { id, ...data } = business;

    /* Re-use doc(id) if present, otherwise auto-generate */
    const ref: DocumentReference = id
      ? doc(this.db, BUSINESSES_COLLECTION, id)
      : doc(this.collRef);

    /* Convert Date → Timestamp for createdAt */
    const createdAtTs =
      business.createdAt instanceof Date
        ? Timestamp.fromDate(business.createdAt)
        : business.createdAt || now;

    await setDoc(
      ref,
      {
        ...data,                 // includes selfRegister, branding, etc.
        createdAt: createdAtTs,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}
