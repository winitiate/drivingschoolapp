// src/data/FirestorePaymentStore.ts
import { Payment } from "../models/Payment";
import { PaymentStore } from "./PaymentStore";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, setDoc, Timestamp } from "firebase/firestore";

const PAYMENTS_COLLECTION = "payments";

export class FirestorePaymentStore implements PaymentStore {
  async getById(id: string): Promise<Payment | null> {
    const snap = await getDoc(doc(db, PAYMENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Payment) };
  }

  async listAll(): Promise<Payment[]> {
    const snaps = await getDocs(collection(db, PAYMENTS_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Payment) }));
  }

  async listByAppointment(appointmentId: string): Promise<Payment[]> {
    const q = query(collection(db, PAYMENTS_COLLECTION), where("appointmentId", "==", appointmentId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Payment) }));
  }

  async listByStudent(studentId: string): Promise<Payment[]> {
    const q = query(collection(db, PAYMENTS_COLLECTION), where("studentId", "==", studentId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Payment) }));
  }

  async save(payment: Payment): Promise<void> {
    const now = Timestamp.now();
    const id = payment.id || doc(collection(db, PAYMENTS_COLLECTION)).id;
    await setDoc(doc(db, PAYMENTS_COLLECTION, id), {
      ...payment,
      createdAt: payment.createdAt || now,
      updatedAt: now,
    });
  }
}