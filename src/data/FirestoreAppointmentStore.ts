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
  private db = getFirestore();
  private coll = collection(this.db, COLLECTION);

  /* ─────────── helpers ─────────── */

  /**
   * Recursively converts Dates → Firestore Timestamps before writing.
   */
  private static toFirestore(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return Timestamp.fromDate(obj);
    if (Array.isArray(obj)) return obj.map(FirestoreAppointmentStore.toFirestore);
    if (typeof obj === "object") {
      const out: any = {};
      Object.entries(obj).forEach(([k, v]) => {
        out[k] = FirestoreAppointmentStore.toFirestore(v);
      });
      return out;
    }
    return obj;
  }

  /**
   * Recursively converts Timestamps → Date after reading.
   */
  private static fromFirestore(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Timestamp) return obj.toDate();
    if (Array.isArray(obj)) return obj.map(FirestoreAppointmentStore.fromFirestore);
    if (typeof obj === "object") {
      const out: any = {};
      Object.entries(obj).forEach(([k, v]) => {
        out[k] = FirestoreAppointmentStore.fromFirestore(v);
      });
      return out;
    }
    return obj;
  }

  private ref(id?: string) {
    return id ? doc(this.db, COLLECTION, id) : doc(this.coll);
  }

  /* ─────────── CRUD ─────────── */

  async getById(id: string): Promise<Appointment | null> {
    const snap = await getDoc(this.ref(id));
    if (!snap.exists()) return null;

    // Convert any Firestore Timestamps to JS Dates
    const data = FirestoreAppointmentStore.fromFirestore(snap.data());
    return { id: snap.id, ...(data as Appointment) };
  }

  async listAll(): Promise<Appointment[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map((d) => {
      const data = FirestoreAppointmentStore.fromFirestore(d.data());
      return { id: d.id, ...(data as Appointment) };
    });
  }

  async listByClient(clientId: string): Promise<Appointment[]> {
    const q = query(this.coll, where("clientIds", "array-contains", clientId));
    const ss = await getDocs(q);
    return ss.docs.map((d) => {
      const data = FirestoreAppointmentStore.fromFirestore(d.data());
      return { id: d.id, ...(data as Appointment) };
    });
  }

  async listByServiceProvider(providerId: string): Promise<Appointment[]> {
    const q = query(this.coll, where("serviceProviderIds", "array-contains", providerId));
    const ss = await getDocs(q);
    return ss.docs.map((d) => {
      const data = FirestoreAppointmentStore.fromFirestore(d.data());
      return { id: d.id, ...(data as Appointment) };
    });
  }

  /**
   * Saves or updates an appointment.  If the document already exists, it merges;
   * this allows us to “soft‐cancel” by saving a new `status: "cancelled"`
   * and `cancellation: {...}` without deleting the record.
   */
  async save(appt: Appointment): Promise<void> {
    const { id, ...rest } = appt; // remove `id` before writing
    const now = serverTimestamp();

    const payload: any = {
      ...FirestoreAppointmentStore.toFirestore(rest),
      updatedAt: now,
      ...(id ? {} : { createdAt: now }),
    };

    console.log("▶️ [Store] writing appointment payload:", payload);
    await setDoc(this.ref(id), payload, { merge: true });
  }

  /**
   * We no longer “hard-delete” here.  If you truly want to remove from Firestore,
   * you can call this; but for “cancellation,” we are simply calling `.save(...)`
   * with an updated `status: "cancelled"` instead.
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(this.ref(id));
  }
}
