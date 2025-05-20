// src/data/FirestoreAppointmentTypeStore.ts

/**
 * FirestoreAppointmentTypeStore.ts
 *
 * Firestore-based implementation of the AppointmentTypeStore interface.
 * Uses the “appointmentTypes” collection in Firestore and assumes each
 * document has a `serviceLocationId: string` field for scoping.
 *
 * Implements AppointmentTypeStore to ensure method signatures stay in sync.
 */

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { AppointmentType } from "../models/AppointmentType";
import { AppointmentTypeStore } from "./AppointmentTypeStore";

export class FirestoreAppointmentTypeStore implements AppointmentTypeStore {
  // Firestore instance and reference to “appointmentTypes” collection
  private db = getFirestore();
  private coll = collection(this.db, "appointmentTypes");

  /**
   * List every appointment type in the system.
   */
  async listAll(): Promise<AppointmentType[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as AppointmentType) }));
  }

  /**
   * List appointment types for a specific service location.
   * @param serviceLocationId  The ID of the location/facility
   */
  async listByServiceLocation(
    serviceLocationId: string
  ): Promise<AppointmentType[]> {
    const q = query(
      this.coll,
      where("serviceLocationId", "==", serviceLocationId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as AppointmentType) }));
  }

  /**
   * Create or update an appointment type document.
   * Preserves existing createdAt if present, updates updatedAt.
   * @param appointmentType  The AppointmentType data to persist
   */
  async save(appointmentType: AppointmentType): Promise<void> {
    const now = Timestamp.now();
    // Determine doc ref: existing or new
    const ref = appointmentType.id
      ? doc(this.db, "appointmentTypes", appointmentType.id)
      : doc(this.db, "appointmentTypes");

    await setDoc(
      ref,
      {
        ...appointmentType,
        createdAt: appointmentType.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

