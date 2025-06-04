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
  deleteDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
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
   * Fetch one ServiceProvider by its Firestore document ID.
   * Returns null if id is empty or document does not exist.
   */
  async getById(id: string): Promise<ServiceProvider | null> {
    if (typeof id !== "string" || id.trim() === "") {
      // Immediately bail on an empty/whitespace‐only ID
      return null;
    }

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
   * Find the first ServiceProvider with a matching "licenseNumber".
   * Returns null if none found or if licenseNumber is empty.
   */
  async findByLicense(
    licenseNumber: string
  ): Promise<ServiceProvider | null> {
    if (typeof licenseNumber !== "string" || licenseNumber.trim() === "") {
      return null;
    }

    const q = query(
      this.collRef,
      where("licenseNumber", "==", licenseNumber.trim())
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const first = snaps.docs[0];
    return { id: first.id, ...(first.data() as ServiceProvider) };
  }

  /**
   * Create or update a ServiceProvider record.
   *
   * - If `provider` is null/undefined ⇒ throw immediately.
   * - If `provider.id` is missing/empty ⇒ generate a new random ID.
   * - Always merge (so we never inadvertently wipe out nested sub‐fields).
   */
  async save(provider: ServiceProvider): Promise<void> {
    if (!provider) {
      throw new Error(
        "FirestoreServiceProviderStore.save() called with `provider` = undefined or null"
      );
    }

    // Pick or generate a Firestore document ID:
    let chosenId = provider.id;
    if (typeof chosenId !== "string" || chosenId.trim() === "") {
      chosenId = doc(this.collRef).id;
    }

    const ref: DocumentReference = doc(
      this.db,
      SERVICE_PROVIDERS_COLLECTION,
      chosenId
    );

    // Build the object we’re going to write:
    // • Keep `createdAt` if caller provided one; otherwise default to now
    // • Always overwrite `updatedAt` to “now”
    const now = Timestamp.now();
    const dataToWrite = {
      ...provider,
      id: chosenId,
      createdAt: provider.createdAt || now,
      updatedAt: now,
    };

    // Use merge: true so that any sub‐fields not included here are not removed
    await setDoc(ref, dataToWrite, { merge: true });
  }

  /**
   * Delete the ServiceProvider document with the given ID.
   * Throws if you pass an empty/whitespace‐only string.
   */
  async delete(id: string): Promise<void> {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error(
        "FirestoreServiceProviderStore.delete() requires a non‐empty `id`"
      );
    }
    await deleteDoc(doc(this.db, SERVICE_PROVIDERS_COLLECTION, id));
  }

  /**
   * Return an array of all ServiceProvider documents (no filtering).
   */
  async listAll(): Promise<ServiceProvider[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceProvider),
    }));
  }

  /**
   * Return all ServiceProvider records whose "providerLocationIds" array
   * contains the given serviceLocationId.
   * If the caller passes an empty ID, return [] immediately.
   */
  async listByServiceLocation(
    serviceLocationId: string
  ): Promise<ServiceProvider[]> {
    if (
      typeof serviceLocationId !== "string" ||
      serviceLocationId.trim() === ""
    ) {
      // Bail early if invalid/empty
      return [];
    }
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
