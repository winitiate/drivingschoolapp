import { Instructor } from '../models/Instructor';
import { InstructorStore } from './InstructorStore';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export class FirestoreInstructorStore implements InstructorStore {
  private db = getFirestore();
  private collectionRef = collection(this.db, 'instructors');

  // List all instructors
  async list(): Promise<Instructor[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Instructor) }));
  }

  // Alias to list() for compatibility with listAll() callers
  async listAll(): Promise<Instructor[]> {
    return this.list();
  }

  // List instructors filtered by schoolId
  async listBySchool(schoolId: string): Promise<Instructor[]> {
    const all = await this.list();
    return all.filter(i => i.schoolIds && i.schoolIds.includes(schoolId));
  }

  // Get instructor by ID
  async getById(id: string): Promise<Instructor | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...(snapshot.data() as Instructor) };
  }

  // Save or update instructor
  async save(instructor: Instructor): Promise<void> {
    const docRef = instructor.id ? doc(this.collectionRef, instructor.id) : doc(this.collectionRef);
    const data = {
      ...instructor,
      updatedAt: serverTimestamp(),
    };
    if (instructor.id) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, data);
    }
  }
}
