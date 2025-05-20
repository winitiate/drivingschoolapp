// src/data/FirestoreGradingScaleStore.ts

/**
 * FirestoreGradingScaleStore.ts
 *
 * Firestore-based implementation of the GradingScaleStore interface.
 * Uses the “gradingScales” collection in Firestore and assumes each
 * document has a `serviceLocationId: string` field for scoping.
 *
 * Implements GradingScaleStore to keep signatures in sync.
 */

import { GradingScale } from "../models/GradingScale";
import { GradingScaleStore } from "./GradingScaleStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// Firestore collection name
const GRADING_SCALES_COLLECTION = "gradingScales";

export class FirestoreGradingScaleStore implements GradingScaleStore {
  // Reference to the Firestore “gradingScales” collection
  private collRef: CollectionReference = collection(db, GRADING_SCALES_COLLECTION);

  /**
   * List *all* grading scales in the collection.
   */
  async listAll(): Promise<GradingScale[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as GradingScale) }));
  }

  /**
   * List grading scales for a specific service location.
   * @param serviceLocationId  The ID of the location/facility
   */
  async listByServiceLocation(serviceLocationId: string): Promise<GradingScale[]> {
    const q = query(
      this.collRef,
      where("serviceLocationId", "==", serviceLocationId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as GradingScale) }));
  }

  /**
   * Create or update a grading scale document.
   * Preserves createdAt if already set, updates updatedAt.
   * @param gradingScale  The GradingScale data to persist
   */
  async save(gradingScale: GradingScale): Promise<void> {
    const now = Timestamp.now();
    // Determine document ID: existing or new
    const id = gradingScale.id || doc(this.collRef).id;
    const docRef: DocumentReference = doc(db, GRADING_SCALES_COLLECTION, id);

    await setDoc(
      docRef,
      {
        ...gradingScale,
        createdAt: gradingScale.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

