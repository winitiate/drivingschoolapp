// src/data/FirestoreBusinessStore.ts

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { Business } from '../models/Business';
import { BusinessStore } from './BusinessStore';

const BUSINESSES_COLLECTION = 'businesses';

export class FirestoreBusinessStore implements BusinessStore {
  private db = getFirestore();
  private coll = collection(this.db, BUSINESSES_COLLECTION);

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
    // Destructure out `id` so it isn't included in the document fields
    const { id, ...data } = business;

    // Choose existing doc or new auto‐ID
    const ref = id
      ? doc(this.db, BUSINESSES_COLLECTION, id)
      : doc(this.coll);

    // Convert any Date fields to Firestore Timestamp and merge
    await setDoc(
      ref,
      {
        ...data,
        createdAt: business.createdAt
          ? Timestamp.fromDate(business.createdAt)
          : now,
        updatedAt: now
      },
      { merge: true }
    );
  }
}
