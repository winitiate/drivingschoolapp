// src/data/FAQStore.ts

/**
 * FAQStore.ts
 *
 * Defines the abstraction interface for “FAQs” — frequently asked questions
 * and answers. All methods return Promises so implementations can be swapped
 * out (e.g. Firestore, REST API, in-memory mock) without changing calling code.
 */

import { FAQ } from "../models/Faq";

export interface FAQStore {
  /**
   * Fetch a single FAQ by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The FAQ object, or null if not found
   */
  getById(id: string): Promise<FAQ | null>;

  /**
   * List *all* FAQs in the system.
   * @returns  Array of all FAQ objects
   */
  listAll(): Promise<FAQ[]>;

  /**
   * List only those FAQs that are marked active.
   * @returns  Array of active FAQ objects
   */
  listActive(): Promise<FAQ[]>;

  /**
   * Create or update an FAQ record.
   * If `faq.id` is provided, merges/overwrites that document;
   * otherwise a new document is created.
   * @param faq  The FAQ data to persist
   */
  save(faq: FAQ): Promise<void>;
}

