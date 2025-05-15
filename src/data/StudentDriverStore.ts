// src/data/StudentDriverStore.ts

import { Student } from "../models/Student";

/**
 * Abstraction for persisting and querying Student records.
 */
export interface StudentDriverStore {
  /**
   * Fetch a single student by their document ID.
   */
  getById(id: string): Promise<Student | null>;

  /**
   * Find a student by their licence number.
   */
  findByLicence(licence: string): Promise<Student | null>;

  /**
   * Create or update a student record.
   */
  save(student: Student): Promise<void>;

  /**
   * List every student across all schools.
   */
  listAll(): Promise<Student[]>;

  /**
   * List only those students enrolled in the given school.
   */
  listBySchool(schoolId: string): Promise<Student[]>;
}
