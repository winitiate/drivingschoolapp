// src/data/FirestorePackageStore.ts
import { Package } from "../models/Package";
import { PackageStore } from "./PackageStore";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";

const PACKAGES_COLLECTION = "packages";

export class FirestorePackageStore implements PackageStore {
  async getById(id: string): Promise<Package | null> {
    const snap = await getDoc(doc(db, PACKAGES_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Package) };
  }

  async listAll(): Promise<Package[]> {
    const snaps = await getDocs(collection(db, PACKAGES_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Package) }));
  }

  async save(pkg: Package): Promise<void> {
    const now = Timestamp.now();
    const id = pkg.id || doc(collection(db, PACKAGES_COLLECTION)).id;
    await setDoc(doc(db, PACKAGES_COLLECTION, id), {
      ...pkg,
      createdAt: pkg.createdAt || now,
      updatedAt: now,
    });
  }
}