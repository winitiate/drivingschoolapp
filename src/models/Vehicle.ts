// src/models/Vehicle.ts
export interface Vehicle {
  // BaseEntity fields
  id?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: 'available' | 'in_maintenance' | 'retired';

  // Vehicle-specific
  vin: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  transmission: 'manual' | 'automatic';
  insuranceExpiry: Date;
  lastMaintenance: Date;
}
