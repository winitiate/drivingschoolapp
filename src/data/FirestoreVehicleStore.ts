// src/data/FirestoreVehicleStore.ts
import { Vehicle } from "../models/Vehicle";
import { VehicleStore } from "./VehicleStore";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";

const VEHICLES_COLLECTION = "vehicles";

export class FirestoreVehicleStore implements VehicleStore {
  async getById(id: string): Promise<Vehicle | null> {
    const snap = await getDoc(doc(db, VEHICLES_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Vehicle) };
  }

  async listAll(): Promise<Vehicle[]> {
    const snaps = await getDocs(collection(db, VEHICLES_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Vehicle) }));
  }

  async save(vehicle: Vehicle): Promise<void> {
    const now = Timestamp.now();
    const id = vehicle.id || doc(collection(db, VEHICLES_COLLECTION)).id;
    await setDoc(doc(db, VEHICLES_COLLECTION, id), {
      ...vehicle,
      createdAt: vehicle.createdAt || now,
      updatedAt: now,
    });
  }
}