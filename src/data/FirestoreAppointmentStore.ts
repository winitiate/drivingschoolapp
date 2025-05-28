// src/data/FirestoreAppointmentStore.ts
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import type { Appointment } from "../models/Appointment";
import { AppointmentStore } from "./AppointmentStore";

const COLLECTION = "appointments";

export class FirestoreAppointmentStore implements AppointmentStore {
  private db   = getFirestore();
  private coll = collection(this.db, COLLECTION);

  /* ───────── helpers ───────── */

  /** Recursively converts Date → Timestamp before write. */
  private static toFirestore(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return Timestamp.fromDate(obj);
    if (Array.isArray(obj))  return obj.map(FirestoreAppointmentStore.toFirestore);
    if (typeof obj === "object") {
      const out: any = {};
      Object.entries(obj).forEach(([k, v]) => (out[k] = FirestoreAppointmentStore.toFirestore(v)));
      return out;
    }
    return obj;
  }

  /** Recursively converts Timestamp → Date after read. */
  private static fromFirestore(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Timestamp) return obj.toDate();
    if (Array.isArray(obj))       return obj.map(FirestoreAppointmentStore.fromFirestore);
    if (typeof obj === "object") {
      const out: any = {};
      Object.entries(obj).forEach(([k, v]) => (out[k] = FirestoreAppointmentStore.fromFirestore(v)));
      return out;
    }
    return obj;
  }

  private ref(id?: string) {
    return id ? doc(this.db, COLLECTION, id) : doc(this.coll);
  }

  /* ───────── CRUD ───────── */

  async getById(id: string): Promise<Appointment | null> {
    const snap = await getDoc(this.ref(id));
    return snap.exists()
      ? { id: snap.id, ...(FirestoreAppointmentStore.fromFirestore(snap.data()) as Appointment) }
      : null;
  }

  async listAll(): Promise<Appointment[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map(d => ({
      id: d.id,
      ...(FirestoreAppointmentStore.fromFirestore(d.data()) as Appointment),
    }));
  }

  async listByClient(clientId: string): Promise<Appointment[]> {
    const q  = query(this.coll, where("clientIds", "array-contains", clientId));
    const ss = await getDocs(q);
    return ss.docs.map(d => ({
      id: d.id,
      ...(FirestoreAppointmentStore.fromFirestore(d.data()) as Appointment),
    }));
  }

  async listByServiceProvider(providerId: string): Promise<Appointment[]> {
    const q  = query(this.coll, where("serviceProviderIds", "array-contains", providerId));
    const ss = await getDocs(q);
    return ss.docs.map(d => ({
      id: d.id,
      ...(FirestoreAppointmentStore.fromFirestore(d.data()) as Appointment),
    }));
  }

  async save(appt: Appointment): Promise<void> {
    const { id, ...rest } = appt;              // strip id
    const now = serverTimestamp();

    const payload = {
      ...FirestoreAppointmentStore.toFirestore(rest),
      updatedAt: now,
      ...(id ? {} : { createdAt: now }),
    };

    console.log("▶️ [Store] writing appointment payload:", payload);
    await setDoc(this.ref(id), payload, { merge: true });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(this.ref(id));
  }
}
