// src/data/StudentDriverStore.ts
import { Student } from "../models/Student";

/**
 * Abstraction layer for student data operations.
 * Components/services use this interface, not Firestore directly.
 */
export interface StudentDriverStore {
  /** Fetch student by Firestore document ID */
  getById(id: string): Promise<Student | null>;

  /** Lookup a student by their licence number */
  findByLicence(licence: string): Promise<Student | null>;

  /** Create or update a student record */
  save(student: Student): Promise<void>;

  /** Retrieve all students */
  listAll(): Promise<Student[]>;
}