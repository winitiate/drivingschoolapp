// src/components/Appointments/ClientAppointmentDialog.tsx
import React from 'react'
import BaseAppointmentForm, { Option } from './BaseAppointmentForm'
import type { Appointment } from '../../models/Appointment'

export interface ClientAppointmentDialogProps {
  open: boolean
  initialData?: Appointment
  onClose: () => void
  onSave: (appt: Appointment) => Promise<void>
  onDelete?: (appt: Appointment) => Promise<void>
  serviceLocationId: string
  providers: Option[]
  types: Option[]
}

export default function ClientAppointmentDialog({
  open,
  initialData,
  onClose,
  onSave,
  onDelete,
  serviceLocationId,
  providers,
  types,
}: ClientAppointmentDialogProps) {
  return (
    <BaseAppointmentForm
      open={open}
      onClose={onClose}
      initialData={initialData}
      onSave={onSave}
      onDelete={onDelete}
      serviceLocationId={serviceLocationId}
      showFields={{ client: false, provider: true, type: true }}
      options={{ providers, types }}
    />
  )
}
