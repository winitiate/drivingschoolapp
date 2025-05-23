// src/data/FirestoreClientStore.ts

/**
 * FirestoreClientStore.ts
 *
 * Firestore-based implementation of the ClientStore interface.
 * Uses the “clients” collection in Firestore and assumes each Client
 * document has a `clientLocationIds: string[]` field for scoping.
 *
 * Implements ClientStore to ensure method signatures stay in sync.
 */

import { Client } from "../models/Client";
import { ClientStore } from "./ClientStore";
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

// Name of the Firestore collection for clients
const CLIENTS_COLLECTION = "clients";

export class FirestoreClientStore implements ClientStore {
  // Reference to the "clients" collection
  private collRef: CollectionReference = collection(db, CLIENTS_COLLECTION);

  /**
   * @inheritdoc
   */
  async getById(id: string): Promise<Client | null> {
    const docRef: DocumentReference = doc(db, CLIENTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Client) };
  }

  /**
   * @inheritdoc
   */
  async findByLicense(licenseNumber: string): Promise<Client | null> {
    const q = query(
      this.collRef,
      where("licenseNumber", "==", licenseNumber)
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const first = snaps.docs[0];
    return { id: first.id, ...(first.data() as Client) };
  }

  /**
   * @inheritdoc
   */
  async save(client: Client): Promise<void> {
    const now = Timestamp.now();
    const ref = client.id
      ? doc(db, CLIENTS_COLLECTION, client.id)
      : doc(this.collRef);
    await setDoc(
      ref,
      {
        ...client,
        createdAt: client.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  /**
   * @inheritdoc
   */
  async listAll(): Promise<Client[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Client) }));
  }

  /**
   * @inheritdoc
   */
  async listByServiceLocation(
    serviceLocationId: string
  ): Promise<Client[]> {
    const q = query(
      this.collRef,
      where("clientLocationIds", "array-contains", serviceLocationId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Client) }));
  }
}
