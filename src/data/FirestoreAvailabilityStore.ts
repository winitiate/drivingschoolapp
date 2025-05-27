import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";
import type {
  Availability,
  AvailabilityScope,
} from "../models/Availability";
import type { AvailabilityStore } from "./AvailabilityStore";

const COLLECTION = "availability";

export class FirestoreAvailabilityStore implements AvailabilityStore {
  private db = getFirestore();
  private coll: CollectionReference = collection(this.db, COLLECTION);

  /** Fetch the one record matching scope+scopeId */
  async getByScope(
    scope: AvailabilityScope,
    scopeId: string
  ): Promise<Availability | null> {
    const q = query(
      this.coll,
      where("scope", "==", scope),
      where("scopeId", "==", scopeId)
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const d = snaps.docs[0];
    return { id: d.id, ...(d.data() as Availability) };
  }

  /** Fetch every availability doc */
  async listAll(): Promise<Availability[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as Availability) }));
  }

  /** Create or update (merge) */
  async save(av: Availability): Promise<void> {
    const now = Timestamp.now();
    const id = av.id || doc(this.coll).id;
    const ref: DocumentReference = doc(this.db, COLLECTION, id);
    await setDoc(
      ref,
      {
        ...av,
        weekly: av.weekly || [],
        blocked: av.blocked || [],
        maxPerDay: av.maxPerDay ?? null,
        createdAt: av.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}
