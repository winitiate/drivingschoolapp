// src/data/FirestoreAssessmentStore.ts
import { Assessment } from "../models/Assessment";
import { AssessmentStore } from "./AssessmentStore";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, setDoc, Timestamp } from "firebase/firestore";

const ASSESSMENTS_COLLECTION = "assessments";

export class FirestoreAssessmentStore implements AssessmentStore {
  async getById(id: string): Promise<Assessment | null> {
    const snap = await getDoc(doc(db, ASSESSMENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Assessment) };
  }

  async listAll(): Promise<Assessment[]> {
    const snaps = await getDocs(collection(db, ASSESSMENTS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Assessment) }));
  }

  async listByAppointment(appointmentId: string): Promise<Assessment[]> {
    const q = query(collection(db, ASSESSMENTS_COLLECTION), where("appointmentId", "==", appointmentId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Assessment) }));
  }

  async save(assessment: Assessment): Promise<void> {
    const now = Timestamp.now();
    const id = assessment.id || doc(collection(db, ASSESSMENTS_COLLECTION)).id;
    await setDoc(doc(db, ASSESSMENTS_COLLECTION, id), {
      ...assessment,
      createdAt: assessment.createdAt || now,
      updatedAt: now,
    });
  }
}