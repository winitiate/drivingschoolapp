// src/data/PaymentStore.ts

/**
 * PaymentStore.ts
 *
 * Defines the abstraction interface for “payments” — monetary transactions
 * tied to appointments with clients. All methods return Promises so
 * implementations can be swapped out (e.g. Firestore, REST API, in-memory mock)
 * without changing calling code.
 */

import { Payment } from "../models/Payment";

export interface PaymentStore {
  /**
   * Fetch a single payment by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The Payment object, or null if not found
   */
  getById(id: string): Promise<Payment | null>;

  /**
   * List *all* payments in the system.
   * @returns  Array of Payment objects
   */
  listAll(): Promise<Payment[]>;

  /**
   * List payments tied to a specific appointment.
   * @param appointmentId  The ID of the appointment to filter by
   * @returns              Array of Payment objects for that appointment
   */
  listByAppointment(appointmentId: string): Promise<Payment[]>;

  /**
   * List payments tied to a specific client.
   * @param clientId  The ID of the client (end recipient) to filter by
   * @returns         Array of Payment objects for that client
   */
  listByClient(clientId: string): Promise<Payment[]>;

  /**
   * Create or update a payment record.
   * If `payment.id` is provided, merges/overwrites that document;
   * otherwise a new document is created.
   * @param payment  The Payment data to persist
   */
  save(payment: Payment): Promise<void>;
}

