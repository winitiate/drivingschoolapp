import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { AppointmentTypeStore } from "./AppointmentTypeStore";
import { AppointmentType } from "../models/AppointmentType";
import { db } from "../firebase";

export class FirestoreAppointmentTypeStore implements AppointmentTypeStore {
  private readonly colRef = collection(db, "appointmentTypes");

  /* ──────────────────────────── helpers ─────────────────────────── */

  /** Convert raw Firestore data to typed entity */
  private toEntity(id: string, data: any): AppointmentType {
    return {
      id,
      serviceLocationId: data.serviceLocationId,
      title:             data.title,
      description:       data.description ?? null,
      durationMinutes:   data.durationMinutes ?? null,
      priceCents:        data.priceCents ?? null,
      order:             data.order ?? null,
      assessmentTypeIds: data.assessmentTypeIds ?? [],
    };
  }

  /* ─────────────────────────── interface ────────────────────────── */

  /** Get a single appointment-type by ID */
  async getById(id: string): Promise<AppointmentType | null> {
    const snap = await getDoc(doc(db, "appointmentTypes", id));
    return snap.exists() ? this.toEntity(snap.id, snap.data()) : null;
  }

  /** List *all* appointment types (rare, admin only) */
  async listAll(): Promise<AppointmentType[]> {
    const snap = await getDocs(this.colRef);
    return snap.docs.map((d) => this.toEntity(d.id, d.data()));
  }

  /** List by service-location, sorted by `order` then title */
  async listByServiceLocation(
    serviceLocationId: string
  ): Promise<AppointmentType[]> {
    const q = query(this.colRef, where("serviceLocationId", "==", serviceLocationId));
    const snap = await getDocs(q);

    const items = snap.docs.map((d) => this.toEntity(d.id, d.data()));
    return items.sort((a, b) =>
      (a.order ?? 0) === (b.order ?? 0)
        ? a.title.localeCompare(b.title)
        : (a.order ?? 0) - (b.order ?? 0)
    );
  }

  /** Save (create or update) */
  async save(item: AppointmentType): Promise<void> {
    const payload = {
      serviceLocationId: item.serviceLocationId,
      title:             item.title,
      description:       item.description ?? null,
      durationMinutes:   item.durationMinutes ?? null,
      priceCents:        item.priceCents ?? null,
      order:             item.order ?? null,
      assessmentTypeIds: item.assessmentTypeIds ?? [],
    };

    if (item.id) {
      await setDoc(doc(db, "appointmentTypes", item.id), payload, { merge: true });
    } else {
      await addDoc(this.colRef, payload);
    }
  }

  /** Delete by ID (not part of interface but handy) */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "appointmentTypes", id));
  }
}
