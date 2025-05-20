// src/data/FirestoreFAQStore.ts

/**
 * FirestoreFAQStore.ts
 *
 * Firestore-based implementation of the FAQStore interface.
 * Uses the “faqs” collection in Firestore and provides:
 *   • getById(id)
 *   • listAll()
 *   • listActive()
 *   • save(faq)
 *
 * Implements FAQStore to guarantee method signatures stay in sync.
 */

import { FAQ } from "../models/FAQ";
import { FAQStore } from "./FAQStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// Firestore collection name for FAQs
const FAQ_COLLECTION = "faqs";

export class FirestoreFAQStore implements FAQStore {
  // Reference to the Firestore “faqs” collection
  private collRef: CollectionReference = collection(db, FAQ_COLLECTION);

  /**
   * @inheritdoc
   */
  async getById(id: string): Promise<FAQ | null> {
    const docRef: DocumentReference = doc(db, FAQ_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as FAQ) };
  }

  /**
   * @inheritdoc
   */
  async listAll(): Promise<FAQ[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as FAQ) }));
  }

  /**
   * @inheritdoc
   */
  async listActive(): Promise<FAQ[]> {
    const activeQuery = query(this.collRef, where("active", "==", true));
    const snaps = await getDocs(activeQuery);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as FAQ) }));
  }

  /**
   * @inheritdoc
   */
  async save(faq: FAQ): Promise<void> {
    const now = Timestamp.now();
    // Determine document ID: use existing or generate new
    const id = faq.id || doc(this.collRef).id;
    const docRef: DocumentReference = doc(db, FAQ_COLLECTION, id);

    await setDoc(
      docRef,
      {
        ...faq,
        createdAt: faq.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

