// src/data/FirestoreAppointmentStore.ts

/**
 * FirestoreAppointmentStore.ts
 *
 * Firestore-based implementation of the AppointmentStore interface.
 * Uses the “appointments” collection in Firestore and assumes each document
 * has `clientId: string` (end user) and `serviceProviderId: string`.
 *
 * Implements AppointmentStore to ensure method signatures stay in sync.
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { Appointment } from "../models/Appointment";
import { AppointmentStore } from "./AppointmentStore";

const APPOINTMENTS_COLLECTION = "appointments";

export class FirestoreAppointmentStore implements AppointmentStore {
  // Firestore instance & reference to the "appointments" collection
  private db = getFirestore();
  private coll = collection(this.db, APPOINTMENTS_COLLECTION);

  /**
   * Fetch a single appointment by its Firestore document ID.
   */
  async getById(id: string): Promise<Appointment | null> {
    const snap = await getDoc(doc(this.db, APPOINTMENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Appointment) };
  }

  /**
   * List *all* appointments in the system.
   */
  async listAll(): Promise<Appointment[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  /**
   * List appointments for a specific client.
   */
  async listByClient(clientId: string): Promise<Appointment[]> {
    const q = query(this.coll, where("clientId", "==", clientId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  /**
   * List appointments for a specific service provider.
   */
  async listByServiceProvider(serviceProviderId: string): Promise<Appointment[]> {
    const q = query(
      this.coll,
      where("serviceProviderId", "==", serviceProviderId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  /**
   * Create or update an appointment document.
   * Preserves createdAt if already set, updates updatedAt.
   */
  async save(appointment: Appointment): Promise<void> {
    const now = Timestamp.now();
    // Choose new or existing docRef
    const ref = appointment.id
      ? doc(this.db, APPOINTMENTS_COLLECTION, appointment.id)
      : doc(this.coll);

    await setDoc(
      ref,
      {
        ...appointment,
        createdAt: appointment.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

