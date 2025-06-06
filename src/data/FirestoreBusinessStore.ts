// src/data/FirestoreBusinessStore.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Business } from "../models/Business";
import type { BusinessStore } from "./BusinessStore";

/**
 * FirestoreBusinessStore
 *
 * Implements BusinessStore by reading/writing to Firestore’s "businesses" collection.
 */
export class FirestoreBusinessStore implements BusinessStore {
  private collectionRef = collection(db, "businesses");

  /** Fetch a single business by its document ID */
  async getById(id: string): Promise<Business | null> {
    const docRef = doc(this.collectionRef, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Business) };
  }

  /** List all businesses in the system */
  async listAll(): Promise<Business[]> {
    const snap = await getDocs(this.collectionRef);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Business) }));
  }

  /**
   * Fetch all businesses where `ownerIds` array contains `ownerUid`.
   * Uses `where("ownerIds", "array-contains", ownerUid)`.
   */
  async queryByOwner(ownerUid: string): Promise<Business[]> {
    const q = query(
      this.collectionRef,
      where("ownerIds", "array-contains", ownerUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Business) }));
  }

  /**
   * Fetch all businesses where `memberIds` array contains `memberUid`.
   * Uses `where("memberIds", "array-contains", memberUid)`.
   */
  async queryByMember(memberUid: string): Promise<Business[]> {
    const q = query(
      this.collectionRef,
      where("memberIds", "array-contains", memberUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Business) }));
  }

  /**
   * Create or update a business record.
   * If business.id is present, it will overwrite (merge) that document. Otherwise, it creates a new one.
   */
  async save(business: Business): Promise<void> {
    const dataToSave: DocumentData = {
      // Always include name, at least:
      name: business.name,
      // Only write email if present (no undefined)
      ...(business.email !== undefined ? { email: business.email } : {}),
      ...(business.phone !== undefined ? { phone: business.phone } : {}),
      ...(business.website !== undefined ? { website: business.website } : {}),
      ...(business.status !== undefined ? { status: business.status } : {}),
      ...(business.notes !== undefined ? { notes: business.notes } : {}),

      // Address sub-object (only if not empty)
      ...(business.address
        ? {
            address: {
              ...(business.address.street !== undefined
                ? { street: business.address.street }
                : {}),
              ...(business.address.city !== undefined
                ? { city: business.address.city }
                : {}),
              ...(business.address.state !== undefined
                ? { state: business.address.state }
                : {}),
              ...(business.address.zipCode !== undefined
                ? { zipCode: business.address.zipCode }
                : {}),
              ...(business.address.country !== undefined
                ? { country: business.address.country }
                : {}),
            },
          }
        : {}),

      // Owner‐array fields (must always be an array, even if empty)
      ownerIds: Array.isArray(business.ownerIds) ? business.ownerIds : [],
      ...(Array.isArray(business.ownerEmails)
        ? { ownerEmails: business.ownerEmails }
        : {}),
      ...(Array.isArray(business.ownerNames)
        ? { ownerNames: business.ownerNames }
        : {}),
      ...(Array.isArray(business.ownerPhones)
        ? { ownerPhones: business.ownerPhones }
        : {}),

      // MemberIds array (optional)
      ...(Array.isArray(business.memberIds)
        ? { memberIds: business.memberIds }
        : {}),

      // Timestamps
      updatedAt: serverTimestamp(),
      ...(business.id ? {} : { createdAt: serverTimestamp() }),
    };

    if (business.id) {
      // Existing business → update (merge fields)
      const docRef = doc(this.collectionRef, business.id);
      await updateDoc(docRef, dataToSave);
    } else {
      // New business → create with a new ID
      const newDocRef = doc(this.collectionRef);
      await setDoc(newDocRef, dataToSave);
    }
  }
}
