import { Appointment } from '../models/Appointment';
import { AppointmentStore } from './AppointmentStore';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export class FirestoreAppointmentStore implements AppointmentStore {
  private db = getFirestore();
  private collectionRef = collection(this.db, 'appointments');

  async list(): Promise<Appointment[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Appointment) }));
  }

  async listBySchool(schoolId: string): Promise<Appointment[]> {
    const allAppointments = await this.list();
    return allAppointments.filter(a => a.schoolIds && a.schoolIds.includes(schoolId));
  }

  async getById(id: string): Promise<Appointment | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...(snapshot.data() as Appointment) };
  }

  async save(appointment: Appointment): Promise<void> {
    const docRef = appointment.id ? doc(this.collectionRef, appointment.id) : doc(this.collectionRef);
    const data = {
      ...appointment,
      updatedAt: serverTimestamp(),
    };
    if (appointment.id) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, data);
    }
  }
}
