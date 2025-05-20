// src/data/FirestorePaymentStore.ts

/**
 * FirestorePaymentStore.ts
 *
 * Firestore-based implementation of the PaymentStore interface.
 * Uses the “payments” collection in Firestore and provides:
 *   • getById(id)
 *   • listAll()
 *   • listByAppointment(appointmentId)
 *   • listByClient(clientId)
 *   • save(payment)
 *
 * Implements PaymentStore to ensure method signatures stay in sync.
 */

import { Payment } from "../models/Payment";
import { PaymentStore } from "./PaymentStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// Firestore collection name
const PAYMENTS_COLLECTION = "payments";

export class FirestorePaymentStore implements PaymentStore {
  // Reference to the Firestore “payments” collection
  private collRef: CollectionReference = collection(db, PAYMENTS_COLLECTION);

  /**
   * Fetch a single payment by its document ID.
   */
  async getById(id: string): Promise<Payment | null> {
    const docRef: DocumentReference = doc(db, PAYMENTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Payment) };
  }

  /**
   * List *all* payments in the system.
   */
  async listAll(): Promise<Payment[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Payment) }));
  }

  /**
   * List payments tied to a specific appointment.
   */
  async listByAppointment(appointmentId: string): Promise<Payment[]> {
    const byApptQuery = query(
      this.collRef,
      where("appointmentId", "==", appointmentId)
    );
    const snaps = await getDocs(byApptQuery);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Payment) }));
  }

  /**
   * List payments tied to a specific client.
   */
  async listByClient(clientId: string): Promise<Payment[]> {
    const byClientQuery = query(
      this.collRef,
      where("clientId", "==", clientId)
    );
    const snaps = await getDocs(byClientQuery);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Payment) }));
  }

  /**
   * Create or update a payment document.
   * Preserves createdAt if already set, and updates updatedAt.
   */
  async save(payment: Payment): Promise<void> {
    const now = Timestamp.now();
    // Choose new or existing docRef
    const docRef: DocumentReference = payment.id
      ? doc(db, PAYMENTS_COLLECTION, payment.id)
      : doc(this.collRef);

    await setDoc(
      docRef,
      {
        ...payment,
        createdAt: payment.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

