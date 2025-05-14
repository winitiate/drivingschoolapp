// src/data/AppointmentStore.ts
import { Appointment } from "../models/Appointment";

/**
 * Abstraction layer for appointment data operations.
 */
export interface AppointmentStore {
  getById(id: string): Promise<Appointment | null>;
  listAll(): Promise<Appointment[]>;
  listByStudent(studentId: string): Promise<Appointment[]>;
  listByInstructor(instructorId: string): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
}