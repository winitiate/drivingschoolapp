import { Appointment } from "../models/Appointment";

export interface AppointmentStore {
  getById(id: string): Promise<Appointment | null>;
  listAll(): Promise<Appointment[]>;
  listByClient(clientId: string): Promise<Appointment[]>;
  listByServiceProvider(serviceProviderId: string): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
  delete(id: string): Promise<void>;
}
