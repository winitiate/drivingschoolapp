// src/components/Appointments/AppointmentFormDialog/types.ts

import type { Appointment } from "../../../models/Appointment";

export interface Option {
  id: string;
  label: string;
}

export interface AppointmentFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appt: Appointment) => Promise<void>;
  onDelete?: (appt: Appointment) => void;
  clients: Option[];
  serviceProviders: Option[];
  appointmentTypes: Option[];
  canEditClient?: boolean;
  canEditAppointmentType?: boolean;
  canEditProvider?: boolean;
  canEditDateTime?: boolean;
  canCancel?: boolean;
  availabilityStore: any;
}
