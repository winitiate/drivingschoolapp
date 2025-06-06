// src/data/FirestoreServicePackageStore.ts

import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ServicePackage } from "../models/ServicePackage";
import type { ServicePackageStore } from "./ServicePackageStore";

const PACKAGES_COLLECTION = "servicePackages";

export class FirestoreServicePackageStore implements ServicePackageStore {
  private colRef = collection(db, PACKAGES_COLLECTION);

  /** List all active packages */
  async listAllActive(): Promise<ServicePackage[]> {
    const q = query(this.colRef, where("active", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServicePackage),
    }));
  }

  /** Get one package by ID */
  async getById(id: string): Promise<ServicePackage | null> {
    const docRef = doc(this.colRef, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as ServicePackage) };
  }

  /** Create or update a package */
  async save(pkg: ServicePackage): Promise<void> {
    const now = Timestamp.now();
    const payload: any = {
      name: pkg.name,
      description: pkg.description,
      priceCents: pkg.priceCents,
      interval: pkg.interval,
      maxLocations: pkg.maxLocations ?? null,
      maxProviders: pkg.maxProviders ?? null,
      maxClients: pkg.maxClients ?? null,
      active: pkg.active,
      stripePriceId: pkg.stripePriceId, // must be set by SuperAdmin
      updatedAt: now,
      ...(pkg.id ? {} : { createdAt: now }),
    };

    if (pkg.id) {
      // update
      await updateDoc(doc(this.colRef, pkg.id), payload);
    } else {
      // new document
      const newRef = doc(this.colRef);
      await setDoc(newRef, payload);
    }
  }

  /** Delete a package (optional; if you want) */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.colRef, id));
  }
}
