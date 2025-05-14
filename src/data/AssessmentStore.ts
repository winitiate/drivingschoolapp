// src/data/AssessmentStore.ts
import { Assessment } from "../models/Assessment";

export interface AssessmentStore {
  getById(id: string): Promise<Assessment | null>;
  listAll(): Promise<Assessment[]>;
  listByAppointment(appointmentId: string): Promise<Assessment[]>;
  save(assessment: Assessment): Promise<void>;
}