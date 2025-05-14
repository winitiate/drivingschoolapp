// src/data/FirestoreInstructorStore.ts
import { Instructor }    from "../models/Instructor";
import { InstructorStore } from "./InstructorStore";
import { db }             from "../firebase";
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

const INSTRUCTORS_COLLECTION = "instructors";

export class FirestoreInstructorStore implements InstructorStore {
  async getById(id: string): Promise<Instructor | null> {
    const snap = await getDoc(doc(db, INSTRUCTORS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Instructor) };
  }

  async findByLicence(licence: string): Promise<Instructor | null> {
    const q = query(
      collection(db, INSTRUCTORS_COLLECTION),
      where("licenceNumber", "==", licence)
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const d = snaps.docs[0];
    return { id: d.id, ...(d.data() as Instructor) };
  }

  async save(instructor: Instructor): Promise<void> {
    const now = Timestamp.now();
    const id = instructor.id || doc(collection(db, INSTRUCTORS_COLLECTION)).id;
    await setDoc(doc(db, INSTRUCTORS_COLLECTION, id), {
      ...instructor,
      createdAt: instructor.createdAt || now,
      updatedAt: now,
    });
  }

  async listAll(): Promise<Instructor[]> {
    const snaps = await getDocs(collection(db, INSTRUCTORS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Instructor) }));
  }
}
