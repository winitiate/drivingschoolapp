// src/data/InstructorStore.ts
import { Instructor } from "../models/Instructor";

/**
 * Abstraction layer for instructor data operations.
 */
export interface InstructorStore {
  /** Fetch instructor by Firestore document ID */
  getById(id: string): Promise<Instructor | null>;

  /** Lookup an instructor by their licence number */
  findByLicence(licence: string): Promise<Instructor | null>;

  /** Create or update an instructor record */
  save(instructor: Instructor): Promise<void>;

  /** Retrieve all instructors */
  listAll(): Promise<Instructor[]>;
}