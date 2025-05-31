// src/data/FirestorePaymentStore.ts

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { Payment, PaymentStatus, PaymentGatewayProvider } from "../models/Payment";
import { PaymentStore } from "./PaymentStore";

export class FirestorePaymentStore implements PaymentStore {
  private db = getFirestore();
  private paymentsCol = collection(this.db, "payments");

  /**
   * Converts a Firestore document snapshot into our Payment type.
   */
  private docToPayment(docSnap: any): Payment {
    const data = docSnap.data();
    return {
      // BaseEntity fields (id, createdAt, updatedAt)
      id: docSnap.id,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),

      // Original fields
      appointmentId: data.appointmentId as string,
      clientId: data.clientId as string,
      amount: data.amount as number,
      currency: data.currency as string,
      tenderType: data.tenderType as string,
      transactionId: data.transactionId as string,
      paymentStatus: data.paymentStatus as PaymentStatus,
      receiptUrl: data.receiptUrl as string,
      processedAt: (data.processedAt as Timestamp).toDate(),
      fees: data.fees as number | undefined,
      netTotal: data.netTotal as number | undefined,
      tenderNote: data.tenderNote as string | undefined,
      cardBrand: data.cardBrand as string | undefined,
      panSuffix: data.panSuffix as string | undefined,
      detailsUrl: data.detailsUrl as string | undefined,
      customFields: data.customFields as Record<string, any> | undefined,

      // New fields
      gateway: data.gateway as PaymentGatewayProvider,
      refundId: data.refundId as string | undefined,
      refundStatus: data.refundStatus as PaymentStatus | undefined,
      refundedAt: data.refundedAt
        ? (data.refundedAt as Timestamp).toDate()
        : undefined,
    } as Payment;
  }

  /**
   * Fetch a single payment by its transactionId (document ID).
   * Returns null if not found.
   */
  async getByTransactionId(transactionId: string): Promise<Payment | null> {
    const docRef = doc(this.paymentsCol, transactionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.docToPayment(snap);
  }

  /**
   * List all payments tied to a given appointment ID.
   * If none exist, returns an empty array.
   */
  async listByAppointmentId(appointmentId: string): Promise<Payment[]> {
    const q = query(
      this.paymentsCol,
      where("appointmentId", "==", appointmentId)
    );
    const snap = await getDocs(q);
    const results: Payment[] = [];
    snap.forEach((docSnap) => {
      results.push(this.docToPayment(docSnap));
    });
    return results;
  }

  /**
   * Create or overwrite a payment document.
   * Uses `payment.transactionId` as the Firestore document ID.
   */
  async save(payment: Payment): Promise<void> {
    const docRef = doc(this.paymentsCol, payment.transactionId);

    // Helper to convert Date → Firestore Timestamp
    const toTimestamp = (d: Date | undefined): Timestamp | null =>
      d ? Timestamp.fromDate(d) : null;

    await setDoc(docRef, {
      // BaseEntity
      createdAt: Timestamp.fromDate(payment.createdAt),
      updatedAt: Timestamp.fromDate(payment.updatedAt),

      // Original fields
      appointmentId: payment.appointmentId,
      clientId: payment.clientId,
      amount: payment.amount,
      currency: payment.currency,
      tenderType: payment.tenderType,
      transactionId: payment.transactionId,
      paymentStatus: payment.paymentStatus,
      receiptUrl: payment.receiptUrl,
      processedAt: Timestamp.fromDate(payment.processedAt),
      fees: payment.fees ?? null,
      netTotal: payment.netTotal ?? null,
      tenderNote: payment.tenderNote ?? null,
      cardBrand: payment.cardBrand ?? null,
      panSuffix: payment.panSuffix ?? null,
      detailsUrl: payment.detailsUrl ?? null,
      customFields: payment.customFields ?? null,

      // New fields
      gateway: payment.gateway,
      refundId: payment.refundId ?? null,
      refundStatus: payment.refundStatus ?? null,
      refundedAt: toTimestamp(payment.refundedAt) ?? null,
    });
  }
}
