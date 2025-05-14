// src/data/SchoolStore.ts
import { School } from "../models/School";

export interface SchoolStore {
  getById(id: string): Promise<School | null>;
  listAll(): Promise<School[]>;
  save(school: School): Promise<void>;
}