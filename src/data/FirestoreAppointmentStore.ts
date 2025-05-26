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
} from "firebase/firestore";
import { Appointment } from "../models/Appointment";
import { AppointmentStore } from "./AppointmentStore";

const APPOINTMENTS_COLLECTION = "appointments";

export class FirestoreAppointmentStore implements AppointmentStore {
  private db = getFirestore();
  private coll = collection(this.db, APPOINTMENTS_COLLECTION);

  async getById(id: string): Promise<Appointment | null> {
    const snap = await getDoc(doc(this.db, APPOINTMENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Appointment) };
  }

  async listAll(): Promise<Appointment[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  async listByClient(clientId: string): Promise<Appointment[]> {
    const q = query(this.coll, where("clientId", "==", clientId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  async listByServiceProvider(serviceProviderId: string): Promise<Appointment[]> {
    const q = query(this.coll, where("serviceProviderId", "==", serviceProviderId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  async save(appointment: Appointment): Promise<void> {
    const now = Timestamp.now();
    const payload: Partial<Appointment> & { updatedAt: any; createdAt?: any } = {
      clientId:           appointment.clientId,
      serviceProviderId:  appointment.serviceProviderId,
      appointmentTypeId:  appointment.appointmentTypeId,
      date:               appointment.date,
      time:               appointment.time,
      serviceLocationIds: appointment.serviceLocationIds || [],
      updatedAt:          now,
    };
    if (!appointment.id) {
      payload.createdAt = now;
    }
    const ref = appointment.id
      ? doc(this.db, APPOINTMENTS_COLLECTION, appointment.id)
      : doc(this.coll);
    console.log("▶️ [Store] writing appointment payload:", payload);
    await setDoc(ref, payload, { merge: true });
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.db, APPOINTMENTS_COLLECTION, id);
    await deleteDoc(ref);
  }
}
