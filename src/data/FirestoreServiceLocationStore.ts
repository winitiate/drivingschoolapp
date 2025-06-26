/**
 * FirestoreServiceLocationStore.ts
 *
 * Concrete implementation of ServiceLocationStore.
 * Transparently persists the new `selfRegister` object.
 */

import {
  getFirestore,
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
import { ServiceLocation } from "../models/ServiceLocation";
import { ServiceLocationStore } from "./ServiceLocationStore";

const COLLECTION_NAME = "serviceLocations";

export class FirestoreServiceLocationStore implements ServiceLocationStore {
  private db = getFirestore();
  private collectionRef: CollectionReference = collection(
    this.db,
    COLLECTION_NAME
  );

  /* ──────────── CRUD ──────────── */

  async getById(id: string): Promise<ServiceLocation | null> {
    const snap = await getDoc(doc(this.db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as ServiceLocation) };
  }

  async save(location: ServiceLocation): Promise<void> {
    const now = Timestamp.now();
    const { id, ...data } = location;

    const docRef: DocumentReference = id
      ? doc(this.db, COLLECTION_NAME, id)
      : doc(this.collectionRef); // auto-ID for new docs

    const createdAtTs =
      location.createdAt instanceof Date
        ? Timestamp.fromDate(location.createdAt)
        : location.createdAt || now;

    await setDoc(
      docRef,
      {
        ...data, // includes selfRegister overrides
        createdAt: createdAtTs,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  async listAll(): Promise<ServiceLocation[]> {
    const snaps = await getDocs(this.collectionRef);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceLocation),
    }));
  }

  async listByOwner(ownerId: string): Promise<ServiceLocation[]> {
    const q = query(this.collectionRef, where("ownerId", "==", ownerId));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceLocation),
    }));
  }
}
