// src/data/NotificationStore.ts

/**
 * NotificationStore.ts
 *
 * Defines the abstraction interface for “notifications” — alerts or messages
 * sent within the app. All methods return Promises so implementations can be
 * swapped out (e.g. Firestore, REST API, in-memory mock) without changing
 * calling code.
 */

import { Notification } from "../models/Notification";

export interface NotificationStore {
  /**
   * Fetch a single notification by its Firestore document ID.
   * @param id  Firestore document ID
   * @returns   The Notification object, or null if not found
   */
  getById(id: string): Promise<Notification | null>;

  /**
   * List *all* notifications in the system.
   * @returns  Array of Notification objects
   */
  listAll(): Promise<Notification[]>;

  /**
   * List only notifications whose status is “pending”.
   * @returns  Array of pending Notification objects
   */
  listPending(): Promise<Notification[]>;

  /**
   * Create or update a notification record.
   * If `notification.id` exists, merges/overwrites that document;
   * otherwise a new document is created.
   * @param notification  The Notification data to persist
   */
  save(notification: Notification): Promise<void>;
}

