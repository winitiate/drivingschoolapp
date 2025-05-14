// src/data/FirestoreSchoolStore.ts
import { School }                    from "../models/School";
import { SchoolStore }               from "./SchoolStore";
import { db }                        from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";

const SCHOOLS_COLLECTION = "schools";

export class FirestoreSchoolStore implements SchoolStore {
  async getById(id: string): Promise<School | null> {
    const snap = await getDoc(doc(db, SCHOOLS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as School) };
  }

  async listAll(): Promise<School[]> {
    const snaps = await getDocs(collection(db, SCHOOLS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as School) }));
  }

  async save(school: School): Promise<void> {
    const now = Timestamp.now();
    const id  = school.id || doc(collection(db, SCHOOLS_COLLECTION)).id;
    await setDoc(doc(db, SCHOOLS_COLLECTION, id), {
      ...school,
      createdAt: school.createdAt || now,
      updatedAt: now,
    });
  }
}
