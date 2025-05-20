// src/data/FirestoreAssessmentStore.ts

/**
 * FirestoreAssessmentStore.ts
 *
 * Firestore-based implementation of the AssessmentStore interface.
 * Uses the “assessments” collection in Firestore and assumes each document
 * has an `appointmentId: string` field for scoping.
 *
 * Implements AssessmentStore to ensure method signatures stay in sync.
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
import { Assessment } from "../models/Assessment";
import { AssessmentStore } from "./AssessmentStore";
import { FirestoreAppointmentStore } from "./FirestoreAppointmentStore";

const ASSESSMENTS_COLLECTION = "assessments";
const MAX_IN_CLAUSE = 10;

export class FirestoreAssessmentStore implements AssessmentStore {
  private db = getFirestore();
  private coll = collection(this.db, ASSESSMENTS_COLLECTION);
  private appointmentStore = new FirestoreAppointmentStore();

  /**
   * Fetch a single assessment by its Firestore document ID.
   */
  async getById(id: string): Promise<Assessment | null> {
    const snap = await getDoc(doc(this.db, ASSESSMENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Assessment) };
  }

  /**
   * List *all* assessments in the system.
   */
  async listAll(): Promise<Assessment[]> {
    const snaps = await getDocs(this.coll);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Assessment) }));
  }

  /**
   * List assessments tied to a specific appointment.
   */
  async listByAppointment(appointmentId: string): Promise<Assessment[]> {
    const q = query(this.coll, where("appointmentId", "==", appointmentId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Assessment) }));
  }

  /**
   * List all assessments for a given service provider.
   * We first fetch that provider's appointments, then query assessments for those IDs.
   */
  async listByServiceProvider(serviceProviderId: string): Promise<Assessment[]> {
    const appts = await this.appointmentStore.listByServiceProvider(serviceProviderId);
    const ids = appts.map(a => a.id!).filter(Boolean);
    return this.listByAppointmentIds(ids);
  }

  /**
   * List all assessments for a given service location.
   * Similar to provider: fetch appointments by location, then assessments.
   */
  async listByServiceLocation(serviceLocationId: string): Promise<Assessment[]> {
    const appts = await this.appointmentStore.listByServiceLocation(serviceLocationId);
    const ids = appts.map(a => a.id!).filter(Boolean);
    return this.listByAppointmentIds(ids);
  }

  /**
   * Helper: given an array of appointment IDs, fetch all matching assessments.
   * Breaks into MAX_IN_CLAUSE‐sized chunks to satisfy Firestore limits.
   */
  private async listByAppointmentIds(appointmentIds: string[]): Promise<Assessment[]> {
    if (appointmentIds.length === 0) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < appointmentIds.length; i += MAX_IN_CLAUSE) {
      chunks.push(appointmentIds.slice(i, i + MAX_IN_CLAUSE));
    }

    const results: Assessment[] = [];
    for (const chunk of chunks) {
      const q = query(this.coll, where("appointmentId", "in", chunk));
      const snaps = await getDocs(q);
      snaps.docs.forEach(d => {
        results.push({ id: d.id, ...(d.data() as Assessment) });
      });
    }
    return results;
  }

  /**
   * Create or update an assessment document.
   * Preserves `createdAt` if already set, and updates `updatedAt`.
   */
  async save(assessment: Assessment): Promise<void> {
    const now = Timestamp.now();
    const ref = assessment.id
      ? doc(this.db, ASSESSMENTS_COLLECTION, assessment.id)
      : doc(this.coll);

    await setDoc(
      ref,
      {
        ...assessment,
        createdAt: assessment.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}
