// src/data/FAQStore.ts
import { FAQ } from "../models/FAQ";

export interface FAQStore {
  getById(id: string): Promise<FAQ | null>;
  listAll(): Promise<FAQ[]>;
  listActive(): Promise<FAQ[]>;
  save(faq: FAQ): Promise<void>;
}