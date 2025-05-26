// src/data/FirestoreAppointmentTypeStore.ts

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { AppointmentTypeStore } from './AppointmentTypeStore';
import { AppointmentType } from '../models/AppointmentType';
import { db } from '../firebase';

export class FirestoreAppointmentTypeStore implements AppointmentTypeStore {
  private readonly colRef = collection(db, 'appointmentTypes');

  /** List all appointment types for a given service location, sorted by `order`. */
  async listByServiceLocation(serviceLocationId: string): Promise<AppointmentType[]> {
    const q = query(
      this.colRef,
      where('serviceLocationId', '==', serviceLocationId)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id:                  docSnap.id,
        serviceLocationId:   data.serviceLocationId,
        title:               data.title,
        description:         data.description,
        durationMinutes:     data.durationMinutes ?? null,
        price:               data.price ?? null,
        order:               data.order ?? null,
        assessmentTypeIds:   data.assessmentTypeIds ?? [],
      } as AppointmentType;
    });
    // ensure correct order
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /**
   * Save or create an appointment type.
   * Uses addDoc for new records (no ID), setDoc(...) for existing ones.
   */
  async save(item: AppointmentType): Promise<void> {
    // Firestore rejects undefined, so normalize to null or empty array
    const payload = {
      serviceLocationId: item.serviceLocationId,
      title:             item.title,
      description:       item.description,
      durationMinutes:   item.durationMinutes ?? null,
      price:             item.price ?? null,
      order:             item.order ?? null,
      assessmentTypeIds: item.assessmentTypeIds ?? [],
    };

    if (item.id) {
      // existing document (two-part path)
      const ref = doc(db, 'appointmentTypes', item.id);
      await setDoc(ref, payload, { merge: true });
    } else {
      // new document
      await addDoc(this.colRef, payload);
    }
  }

  /** Delete an appointment type by ID. */
  async delete(id: string): Promise<void> {
    const ref = doc(db, 'appointmentTypes', id);
    await deleteDoc(ref);
  }
}
