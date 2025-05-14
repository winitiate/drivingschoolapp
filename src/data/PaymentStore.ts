// src/data/PaymentStore.ts
import { Payment } from "../models/Payment";

export interface PaymentStore {
  getById(id: string): Promise<Payment | null>;
  listAll(): Promise<Payment[]>;
  listByAppointment(appointmentId: string): Promise<Payment[]>;
  listByStudent(studentId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}