// src/data/FirestoreLessonTypeStore.ts
import { LessonType }                 from "../models/LessonType";
import { LessonTypeStore }            from "./LessonTypeStore";
import { db }                         from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, setDoc, Timestamp } from "firebase/firestore";

const LESSON_TYPES_COLLECTION = "lessonTypes";

export class FirestoreLessonTypeStore implements LessonTypeStore {
  async getById(id: string): Promise<LessonType | null> {
    const snap = await getDoc(doc(db, LESSON_TYPES_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as LessonType) };
  }

  async listAll(): Promise<LessonType[]> {
    const snaps = await getDocs(collection(db, LESSON_TYPES_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as LessonType) }));
  }

  async listBySchool(schoolId: string): Promise<LessonType[]> {
    const q     = query(collection(db, LESSON_TYPES_COLLECTION), where("schoolId", "==", schoolId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as LessonType) }));
  }

  async save(lessonType: LessonType): Promise<void> {
    const now = Timestamp.now();
    const id  = lessonType.id || doc(collection(db, LESSON_TYPES_COLLECTION)).id;
    await setDoc(doc(db, LESSON_TYPES_COLLECTION, id), {
      ...lessonType,
      createdAt: lessonType.createdAt || now,
      updatedAt: now,
    });
  }
}