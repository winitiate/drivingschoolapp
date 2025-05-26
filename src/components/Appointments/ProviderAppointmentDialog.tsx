// src/components/Appointments/ProviderAppointmentDialog.tsx
import React from 'react'
import BaseAppointmentForm, { Option } from './BaseAppointmentForm'
import type { Appointment } from '../../models/Appointment'

export interface ProviderAppointmentDialogProps {
  open: boolean
  initialData?: Appointment
  onClose: () => void
  onSave: (appt: Appointment) => Promise<void>
  onDelete?: (appt: Appointment) => Promise<void>
  serviceLocationId: string
  clients: Option[]
  types: Option[]
}

export default function ProviderAppointmentDialog({
  open,
  initialData,
  onClose,
  onSave,
  onDelete,
  serviceLocationId,
  clients,
  types,
}: ProviderAppointmentDialogProps) {
  return (
    <BaseAppointmentForm
      open={open}
      onClose={onClose}
      initialData={initialData}
      onSave={onSave}
      onDelete={onDelete}
      serviceLocationId={serviceLocationId}
      showFields={{ client: true, provider: false, type: true }}
      options={{ clients, types }}
    />
  )
}
