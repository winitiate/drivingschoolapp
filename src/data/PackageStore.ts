// src/data/PackageStore.ts
import { Package } from "../models/Package";

export interface PackageStore {
  getById(id: string): Promise<Package | null>;
  listAll(): Promise<Package[]>;
  save(pkg: Package): Promise<void>;
}