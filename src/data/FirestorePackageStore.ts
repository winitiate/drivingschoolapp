// src/data/FirestorePackageStore.ts

/**
 * FirestorePackageStore.ts
 *
 * Firestore-based implementation of the PackageStore interface.
 * Uses the “packages” collection in Firestore and provides:
 *   • getById(id)
 *   • listAll()
 *   • save(pkg)
 *
 * Implements PackageStore to ensure method signatures stay in sync.
 */

import { Package } from "../models/Package";
import { PackageStore } from "./PackageStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// Firestore collection name for packages
const PACKAGES_COLLECTION = "packages";

export class FirestorePackageStore implements PackageStore {
  // Reference to the Firestore “packages” collection
  private collRef: CollectionReference = collection(db, PACKAGES_COLLECTION);

  /**
   * Fetch a single package by its Firestore document ID.
   */
  async getById(id: string): Promise<Package | null> {
    const docRef: DocumentReference = doc(db, PACKAGES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Package) };
  }

  /**
   * List *all* packages in the system.
   */
  async listAll(): Promise<Package[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Package) }));
  }

  /**
   * Create or update a package record.
   * Preserves createdAt if already set, and updates updatedAt.
   */
  async save(pkg: Package): Promise<void> {
    const now = Timestamp.now();
    // Determine document ID: existing or new
    const id = pkg.id || doc(this.collRef).id;
    const docRef: DocumentReference = doc(db, PACKAGES_COLLECTION, id);

    await setDoc(
      docRef,
      {
        ...pkg,
        createdAt: pkg.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

