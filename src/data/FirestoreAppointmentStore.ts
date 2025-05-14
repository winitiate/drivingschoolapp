// src/data/FirestoreAppointmentStore.ts
import { Appointment } from "../models/Appointment";
import { AppointmentStore } from "./AppointmentStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp
} from "firebase/firestore";

const APPOINTMENTS_COLLECTION = "appointments";

export class FirestoreAppointmentStore implements AppointmentStore {
  async getById(id: string): Promise<Appointment | null> {
    const snap = await getDoc(doc(db, APPOINTMENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Appointment) };
  }

  async listAll(): Promise<Appointment[]> {
    const snaps = await getDocs(collection(db, APPOINTMENTS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  async listByStudent(studentId: string): Promise<Appointment[]> {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where("studentId", "==", studentId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  async listByInstructor(instructorId: string): Promise<Appointment[]> {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where("instructorId", "==", instructorId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Appointment) }));
  }

  async save(appointment: Appointment): Promise<void> {
    const now = Timestamp.now();
    const id = appointment.id || doc(collection(db, APPOINTMENTS_COLLECTION)).id;
    await setDoc(doc(db, APPOINTMENTS_COLLECTION, id), {
      ...appointment,
      createdAt: appointment.createdAt || now,
      updatedAt: now,
    });
  }
}