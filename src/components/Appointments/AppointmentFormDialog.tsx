// src/components/Appointments/AppointmentFormDialog.tsx

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { v4 as uuidv4 } from 'uuid'

import type { Appointment } from '../../models/Appointment'

export interface Option {
  id: string
  label: string
}

export interface AppointmentFormDialogProps {
  open: boolean
  serviceLocationId: string
  initialData?: Appointment
  onClose: () => void
  onSave: (appt: Appointment) => Promise<void>
  /** if provided, shows “Cancel Appointment” button when editing */
  onDelete?: (appt: Appointment) => Promise<void>
  clients: Option[]
  serviceProviders: Option[]
  appointmentTypes: Option[]
  /** hide or disable fields as needed */
  canEditClient?: boolean
  canEditAppointmentType?: boolean
  canEditProvider?: boolean
  canEditDateTime?: boolean
  canCancel?: boolean
}

export default function AppointmentFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  onDelete,
  clients,
  serviceProviders,
  appointmentTypes,
  canEditClient = true,
  canEditAppointmentType = true,
  canEditProvider = true,
  canEditDateTime = true,
  canCancel = true,
}: AppointmentFormDialogProps) {
  const isEdit = Boolean(initialData?.id)

  // form state
  const [appointmentTypeId, setAppointmentTypeId] = useState('')
  const [clientId, setClientId] = useState('')
  const [serviceProviderId, setServiceProviderId] = useState('')
  const [appointmentDateTime, setAppointmentDateTime] = useState<Date | null>(
    new Date()
  )
  const [saving, setSaving] = useState(false)

  // initialize / reset form when opened or when initialData changes
  useEffect(() => {
    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId)
      setClientId(initialData.clientId)
      setServiceProviderId(initialData.serviceProviderId)
      if (initialData.date && initialData.time) {
        setAppointmentDateTime(new Date(`${initialData.date}T${initialData.time}`))
      }
    } else {
      setAppointmentTypeId(appointmentTypes[0]?.id || '')
      setClientId(clients[0]?.id || '')
      setServiceProviderId(serviceProviders[0]?.id || '')
      setAppointmentDateTime(new Date())
    }
  }, [open, initialData, appointmentTypes, clients, serviceProviders])

  // gather a human label for read-only client
  const clientLabel =
    clients.find((c) => c.id === (initialData?.clientId || clientId))?.label ||
    ''

  const dialogTitle = !canEditClient && clientLabel
    ? `${clientLabel}'s Appointment`
    : isEdit
    ? 'Edit Appointment'
    : 'Add Appointment'

  const handleSubmit = async () => {
    if (!appointmentDateTime) return
    setSaving(true)

    const iso = appointmentDateTime.toISOString()
    const [dateStr, timeWithZone] = iso.split('T')
    const timeStr = timeWithZone.substring(0, 5)

    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientId,
      serviceProviderId,
      date: dateStr,
      time: timeStr,
      serviceLocationIds: Array.from(
        new Set([...(initialData?.serviceLocationIds || []), serviceLocationId])
      ),
    }

    try {
      await onSave(appt)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (initialData && onDelete) {
      setSaving(true)
      try {
        await onDelete(initialData)
        onClose()
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Appointment Type */}
          <TextField
            select
            label="Appointment Type"
            value={appointmentTypeId}
            onChange={(e) => setAppointmentTypeId(e.target.value)}
            fullWidth
            disabled={!canEditAppointmentType}
          >
            {appointmentTypes.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Client */}
          {canEditClient ? (
            <TextField
              select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              fullWidth
            >
              {clients.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Box>
              <Typography variant="subtitle2">Client</Typography>
              <Typography variant="body1">{clientLabel}</Typography>
            </Box>
          )}

          {/* Service Provider */}
          <TextField
            select
            label="Service Provider"
            value={serviceProviderId}
            onChange={(e) => setServiceProviderId(e.target.value)}
            fullWidth
            disabled={!canEditProvider}
          >
            {serviceProviders.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Date & Time */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={appointmentDateTime}
              onChange={setAppointmentDateTime}
              disabled={!canEditDateTime}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        {isEdit && canCancel && onDelete && (
          <Button
            color="error"
            onClick={handleDelete}
            disabled={saving}
          >
            Cancel Appointment
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
