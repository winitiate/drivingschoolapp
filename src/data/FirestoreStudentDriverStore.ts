// src/data/FirestoreStudentDriverStore.ts
import { Student } from "../models/Student";
import { StudentDriverStore } from "./StudentDriverStore";
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

const STUDENTS_COLLECTION = "students";

/**
 * Firestore implementation of StudentDriverStore.
 */
export class FirestoreStudentDriverStore implements StudentDriverStore {
  async getById(id: string): Promise<Student | null> {
    const snap = await getDoc(doc(db, STUDENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Student) };
  }

  async findByLicence(licence: string): Promise<Student | null> {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where("licenceNumber", "==", licence)
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const d = snaps.docs[0];
    return { id: d.id, ...(d.data() as Student) };
  }

  async save(student: Student): Promise<void> {
    const now = Timestamp.now();
    const id = student.id || doc(collection(db, STUDENTS_COLLECTION)).id;
    await setDoc(doc(db, STUDENTS_COLLECTION, id), {
      ...student,
      createdAt: student.createdAt || now,
      updatedAt: now,
    }, { merge: true });
  }

  async listAll(): Promise<Student[]> {
    const snaps = await getDocs(collection(db, STUDENTS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Student) }));
  }

  /** List only those students whose schoolIds includes the given schoolId */
  async listBySchool(schoolId: string): Promise<Student[]> {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where("schoolIds", "array-contains", schoolId)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Student) }));
  }
}
