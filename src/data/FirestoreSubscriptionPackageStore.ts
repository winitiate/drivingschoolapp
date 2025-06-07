// src/data/FirestoreSubscriptionPackageStore.ts

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type { SubscriptionPackage } from "../models/SubscriptionPackage";
import type { SubscriptionPackageStore } from "./SubscriptionPackageStore";

const COLLECTION_NAME = "subscriptionPackages";

export class FirestoreSubscriptionPackageStore
  implements SubscriptionPackageStore
{
  private db = getFirestore();
  private collRef: CollectionReference = collection(
    this.db,
    COLLECTION_NAME
  );

  private docToEntity(
    snap: QueryDocumentSnapshot
  ): SubscriptionPackage {
    const data = snap.data() as any;
    return {
      id: snap.id,
      title: data.title,
      description: data.description ?? "",
      priceCents: data.priceCents,
      maxLocations: data.maxLocations ?? null,
      maxProviders: data.maxProviders ?? null,
      maxClients: data.maxClients ?? null,
      order: data.order ?? 0,
      createdAt: data.createdAt
        ? (data.createdAt as Timestamp).toDate()
        : undefined,
      updatedAt: data.updatedAt
        ? (data.updatedAt as Timestamp).toDate()
        : undefined,
    };
  }

  /** Fetch a single package by ID. */
  async getById(id: string): Promise<SubscriptionPackage | null> {
    if (!id) return null;
    const ref: DocumentReference = doc(
      this.db,
      COLLECTION_NAME,
      id
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return this.docToEntity(snap as QueryDocumentSnapshot);
  }

  /** List all packages (no ordering). */
  async listAll(): Promise<SubscriptionPackage[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map((d) => this.docToEntity(d));
  }

  /** List only “active” packages ordered by `order` ascending. */
  async listAllActive(): Promise<SubscriptionPackage[]> {
    const q = query(
      this.collRef,
      orderBy("order", "asc")
    );
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => this.docToEntity(d));
  }

  /** Create or update a package. */
  async save(pkg: SubscriptionPackage): Promise<void> {
    let id = pkg.id;
    if (!id) {
      // generate new ID
      id = doc(this.collRef).id;
    }
    const ref: DocumentReference = doc(
      this.db,
      COLLECTION_NAME,
      id
    );
    const now = Timestamp.now();

    const payload: any = {
      title: pkg.title,
      description: pkg.description ?? "",
      priceCents: pkg.priceCents,
      maxLocations: pkg.maxLocations ?? null,
      maxProviders: pkg.maxProviders ?? null,
      maxClients: pkg.maxClients ?? null,
      order: pkg.order ?? 0,
      updatedAt: now,
    };

    if (!pkg.id) {
      payload.createdAt = now;
    }

    await setDoc(ref, payload, { merge: true });
  }

  /** Delete a package by ID. */
  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid subscription-package ID");
    await deleteDoc(doc(this.db, COLLECTION_NAME, id));
  }
}
