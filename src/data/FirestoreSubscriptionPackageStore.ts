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
import { SubscriptionPackage } from "../models/SubscriptionPackage";
import { SubscriptionPackageStore } from "./SubscriptionPackageStore";

const COLLECTION_NAME = "subscriptionPackages";

export class FirestoreSubscriptionPackageStore implements SubscriptionPackageStore {
  private db = getFirestore();
  private collRef: CollectionReference = collection(this.db, COLLECTION_NAME);

  /** Convert Firestore doc → SubscriptionPackage */
  private docToEntity(docSnap: QueryDocumentSnapshot): SubscriptionPackage {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      title: data.title,
      description: data.description ?? "",
      priceCents: data.priceCents,
      maxLocations: data.maxLocations ?? null,
      maxProviders: data.maxProviders ?? null,
      maxClients: data.maxClients ?? null,
      order: data.order ?? 0,
      visible: data.visible ?? true,
      callToAction: data.callToAction ?? "register",
      createdAt: data.createdAt
        ? (data.createdAt as Timestamp).toDate()
        : undefined,
      updatedAt: data.updatedAt
        ? (data.updatedAt as Timestamp).toDate()
        : undefined,
    };
  }

  /** List all, ordered by `order` ascending */
  async listAll(): Promise<SubscriptionPackage[]> {
    const q = query(this.collRef, orderBy("order", "asc"));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => this.docToEntity(d));
  }

  /** Same as listAll, public pricing page will filter by visible flag */
  async listAllActive(): Promise<SubscriptionPackage[]> {
    return this.listAll();
  }

  /** Fetch one by ID */
  async getById(id: string): Promise<SubscriptionPackage | null> {
    if (!id) return null;
    const ref: DocumentReference = doc(this.db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return this.docToEntity(snap as QueryDocumentSnapshot);
  }

  /** Save (create or update) */
  async save(pkg: SubscriptionPackage): Promise<void> {
    if (!pkg) throw new Error("Attempt to save undefined package");

    let docId = pkg.id;
    if (!docId || !docId.trim()) {
      docId = doc(this.collRef).id;
    }
    const ref: DocumentReference = doc(this.db, COLLECTION_NAME, docId);
    const now = Timestamp.now();

    const payload: any = {
      title: pkg.title,
      description: pkg.description ?? "",
      priceCents: pkg.priceCents,
      maxLocations: pkg.maxLocations ?? null,
      maxProviders: pkg.maxProviders ?? null,
      maxClients: pkg.maxClients ?? null,
      order: pkg.order ?? 0,
      visible: pkg.visible ?? true,
      callToAction: pkg.callToAction ?? "register",
      updatedAt: now,
    };
    if (!pkg.id) {
      payload.createdAt = now;
    }

    await setDoc(ref, payload, { merge: true });
  }

  /** Delete by ID */
  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID for deletion");
    await deleteDoc(doc(this.db, COLLECTION_NAME, id));
  }
}
