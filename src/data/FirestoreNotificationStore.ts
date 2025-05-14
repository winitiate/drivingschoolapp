// src/data/FirestoreNotificationStore.ts
import { Notification } from "../models/Notification";
import { NotificationStore } from "./NotificationStore";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, setDoc, Timestamp } from "firebase/firestore";

const NOTIFICATIONS_COLLECTION = "notifications";

export class FirestoreNotificationStore implements NotificationStore {
  async getById(id: string): Promise<Notification | null> {
    const snap = await getDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Notification) };
  }

  async listAll(): Promise<Notification[]> {
    const snaps = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Notification) }));
  }

  async listPending(): Promise<Notification[]> {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("status", "==", "pending"));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Notification) }));
  }

  async save(notification: Notification): Promise<void> {
    const now = Timestamp.now();
    const id = notification.id || doc(collection(db, NOTIFICATIONS_COLLECTION)).id;
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), {
      ...notification,
      createdAt: notification.createdAt || now,
      updatedAt: now,
    });
  }
}