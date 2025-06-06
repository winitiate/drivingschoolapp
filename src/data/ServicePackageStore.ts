// src/data/ServicePackageStore.ts

import type { ServicePackage } from "../models/ServicePackage";

export interface ServicePackageStore {
  /** List all active service packages (plans) */
  listAllActive(): Promise<ServicePackage[]>;

  /** Fetch a single package by its document ID */
  getById(id: string): Promise<ServicePackage | null>;

  /** Create or update a package */
  save(pkg: ServicePackage): Promise<void>;

  /** (Optional) Delete a package */
  delete(id: string): Promise<void>;
}
