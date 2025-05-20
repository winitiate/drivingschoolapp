// src/data/FirestoreServiceLocationStore.ts

/**
 * FirestoreServiceLocationStore.ts
 *
 * Firestore-based implementation of the ServiceLocationStore interface.
 * Uses the “serviceLocations” collection in Firestore and assumes each
 * document has `ownerId: string` and `adminIds: string[]` fields.
 *
 * Implements ServiceLocationStore to guarantee method signatures stay in sync.
 */

import { ServiceLocation } from "../models/ServiceLocation";
import { ServiceLocationStore } from "./ServiceLocationStore";
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

// Firestore collection name for service locations
const SERVICE_LOCATIONS_COLLECTION = "serviceLocations";

export class FirestoreServiceLocationStore implements ServiceLocationStore {
  // Reference to the Firestore “serviceLocations” collection
  private collRef: CollectionReference = collection(
    db,
    SERVICE_LOCATIONS_COLLECTION
  );

  /**
   * @inheritdoc
   */
  async getById(id: string): Promise<ServiceLocation | null> {
    const docRef: DocumentReference = doc(
      db,
      SERVICE_LOCATIONS_COLLECTION,
      id
    );
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as ServiceLocation) };
  }

  /**
   * @inheritdoc
   */
  async save(location: ServiceLocation): Promise<void> {
    const now = Timestamp.now();
    // Determine document ID: existing or new
    const id = location.id || doc(this.collRef).id;
    const docRef: DocumentReference = doc(
      db,
      SERVICE_LOCATIONS_COLLECTION,
      id
    );

    await setDoc(
      docRef,
      {
        ...location,
        createdAt: location.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  /**
   * @inheritdoc
   */
  async listAll(): Promise<ServiceLocation[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceLocation),
    }));
  }

  /**
   * @inheritdoc
   */
  async listByOwner(ownerId: string): Promise<ServiceLocation[]> {
    const q = query(
      this.collRef,
      where("ownerId", "==", ownerId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceLocation),
    }));
  }
}

