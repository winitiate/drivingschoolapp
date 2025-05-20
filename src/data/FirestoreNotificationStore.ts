// src/data/FirestoreNotificationStore.ts

/**
 * FirestoreNotificationStore.ts
 *
 * Firestore-based implementation of the NotificationStore interface.
 * Uses the “notifications” collection in Firestore and provides:
 *   • getById(id)
 *   • listAll()
 *   • listPending()
 *   • save(notification)
 *
 * Implements NotificationStore to ensure method signatures stay in sync.
 */

import { Notification } from "../models/Notification";
import { NotificationStore } from "./NotificationStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// Firestore collection name
const NOTIFICATIONS_COLLECTION = "notifications";

export class FirestoreNotificationStore implements NotificationStore {
  // Reference to the Firestore “notifications” collection
  private collRef: CollectionReference = collection(db, NOTIFICATIONS_COLLECTION);

  /**
   * Fetch a single notification by its document ID.
   * @param id  Firestore document ID
   * @returns   The Notification object, or null if not found
   */
  async getById(id: string): Promise<Notification | null> {
    const docRef: DocumentReference = doc(db, NOTIFICATIONS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Notification) };
  }

  /**
   * List *all* notifications in the collection.
   * @returns  Array of Notification objects
   */
  async listAll(): Promise<Notification[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Notification) }));
  }

  /**
   * List only notifications whose status is “pending”.
   * @returns  Array of pending Notification objects
   */
  async listPending(): Promise<Notification[]> {
    const pendingQuery = query(this.collRef, where("status", "==", "pending"));
    const snaps = await getDocs(pendingQuery);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Notification) }));
  }

  /**
   * Create or update a notification document.
   * If `notification.id` exists, merges into that doc; otherwise generates a new ID.
   * Preserves createdAt if already set, and updates updatedAt.
   * @param notification  The Notification data to persist
   */
  async save(notification: Notification): Promise<void> {
    const now = Timestamp.now();
    // Prepare a new docRef if needed
    const newDocRef: DocumentReference = doc(this.collRef);
    const docRef = notification.id
      ? doc(db, NOTIFICATIONS_COLLECTION, notification.id)
      : newDocRef;

    await setDoc(
      docRef,
      {
        ...notification,
        createdAt: notification.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

