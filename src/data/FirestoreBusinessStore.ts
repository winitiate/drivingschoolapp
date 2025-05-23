// src\data\FirestoreBusinessStore.ts
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { Business } from '../models/Business';
import { BusinessStore } from './BusinessStore';

const BUSINESSES_COLLECTION = 'businesses';

export class FirestoreBusinessStore implements BusinessStore {
  private db = getFirestore();
  private coll: CollectionReference = collection(this.db, BUSINESSES_COLLECTION);

  async getById(id: string): Promise<Business | null> {
    const snap = await getDoc(doc(this.db, BUSINESSES_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Business) };
  }

  async listAll(): Promise<Business[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Business) }));
  }

  async save(business: Business): Promise<void> {
    const now = Timestamp.now();
    // Destructure out `id` so it isn't in the document fields
    const { id, ...data } = business;

    // Choose existing doc or new auto‐ID
    const ref: DocumentReference = id
      ? doc(this.db, BUSINESSES_COLLECTION, id)
      : doc(this.coll);

    // Convert any Date fields (createdAt) to Firestore Timestamp
    const createdAtTs = business.createdAt
      ? (business.createdAt instanceof Date
          ? Timestamp.fromDate(business.createdAt)
          : business.createdAt)
      : now;

    await setDoc(
      ref,
      {
        ...data,
        // copy through ownerId & ownerEmail as-is
        ownerId:    business.ownerId,
        ownerEmail: business.ownerEmail,
        createdAt:  createdAtTs,
        updatedAt:  now
      },
      { merge: true }
    );
  }
}
