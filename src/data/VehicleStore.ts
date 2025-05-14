// src/data/VehicleStore.ts
import { Vehicle } from "../models/Vehicle";

export interface VehicleStore {
  getById(id: string): Promise<Vehicle | null>;
  listAll(): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
}