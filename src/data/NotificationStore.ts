// src/data/NotificationStore.ts
import { Notification } from "../models/Notification";

export interface NotificationStore {
  getById(id: string): Promise<Notification | null>;
  listAll(): Promise<Notification[]>;
  listPending(): Promise<Notification[]>;
  save(notification: Notification): Promise<void>;
}