// src/data/FirestoreServiceProviderStore.ts

/**
 * FirestoreServiceProviderStore.ts
 *
 * Firestore-based implementation of the ServiceProviderStore interface.
 * Uses the “serviceProviders” collection in Firestore and assumes each
 * document has a `providerLocationIds: string[]` field for scoping providers.
 *
 * Implements ServiceProviderStore to keep signatures in sync.
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
  DocumentReference
} from "firebase/firestore";
import { ServiceProvider } from "../models/ServiceProvider";
import { ServiceProviderStore } from "./ServiceProviderStore";

const SERVICE_PROVIDERS_COLLECTION = "serviceProviders";

export class FirestoreServiceProviderStore implements ServiceProviderStore {
  private db = getFirestore();
  private collRef: CollectionReference = collection(
    this.db,
    SERVICE_PROVIDERS_COLLECTION
  );

  /**
   * @inheritdoc
   */
  async getById(id: string): Promise<ServiceProvider | null> {
    const ref: DocumentReference = doc(
      this.db,
      SERVICE_PROVIDERS_COLLECTION,
      id
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as ServiceProvider) };
  }

  /**
   * @inheritdoc
   */
  async findByLicense(
    licenseNumber: string
  ): Promise<ServiceProvider | null> {
    const q = query(
      this.collRef,
      where("licenseNumber", "==", licenseNumber)
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const first = snaps.docs[0];
    return { id: first.id, ...(first.data() as ServiceProvider) };
  }

  /**
   * @inheritdoc
   */
  async save(provider: ServiceProvider): Promise<void> {
    const now = Timestamp.now();
    const id = provider.id || doc(this.collRef).id;
    const ref: DocumentReference = doc(
      this.db,
      SERVICE_PROVIDERS_COLLECTION,
      id
    );

    await setDoc(
      ref,
      {
        ...provider,
        createdAt: provider.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  /**
   * @inheritdoc
   */
  async listAll(): Promise<ServiceProvider[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceProvider),
    }));
  }

  /**
   * @inheritdoc
   */
  async listByServiceLocation(
    serviceLocationId: string
  ): Promise<ServiceProvider[]> {
    const q = query(
      this.collRef,
      where("providerLocationIds", "array-contains", serviceLocationId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceProvider),
    }));
  }
}
