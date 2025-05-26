// src/components/Appointments/BaseAppointmentForm.tsx
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { v4 as uuidv4 } from 'uuid'
import type { Appointment } from '../../models/Appointment'

export interface Option {
  id: string
  label: string
}

export interface BaseAppointmentFormProps {
  /** dialog control */
  open: boolean
  onClose: () => void

  /** save/delete callbacks */
  initialData?: Appointment
  onSave: (appt: Appointment) => Promise<void>
  onDelete?: (appt: Appointment) => Promise<void>

  /** to seed or join the appointment */
  serviceLocationId: string

  /** which dropdowns to show */
  showFields: {
    client: boolean
    provider: boolean
    type: boolean
  }

  /** the dropdown lists */
  options: {
    clients?: Option[]
    providers?: Option[]
    types?: Option[]
  }
}

export default function BaseAppointmentForm({
  open,
  onClose,
  initialData,
  onSave,
  onDelete,
  serviceLocationId,
  showFields,
  options,
}: BaseAppointmentFormProps) {
  const isEdit = Boolean(initialData?.id)

  const [typeId, setTypeId] = useState('')
  const [clientId, setClientId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [dateTime, setDateTime] = useState<Date | null>(new Date())
  const [saving, setSaving] = useState(false)

  // reset form on open / data change
  useEffect(() => {
    if (initialData) {
      setTypeId(initialData.appointmentTypeId)
      setClientId(initialData.clientId)
      setProviderId(initialData.serviceProviderId)
      if (initialData.date && initialData.time) {
        setDateTime(new Date(`${initialData.date}T${initialData.time}`))
      }
    } else {
      setTypeId(options.types?.[0]?.id || '')
      setClientId(options.clients?.[0]?.id || '')
      setProviderId(options.providers?.[0]?.id || '')
      setDateTime(new Date())
    }
  }, [open, initialData, options])

  const handleSave = async () => {
    if (!dateTime) return
    setSaving(true)
    try {
      const iso = dateTime.toISOString()
      const [dateStr, timeWithZone] = iso.split('T')
      const timeStr = timeWithZone.substring(0, 5) // "HH:MM"

      const appt: Appointment = {
        id: initialData?.id || uuidv4(),
        appointmentTypeId: typeId,
        clientId,
        serviceProviderId: providerId,
        date: dateStr,
        time: timeStr,
        serviceLocationIds: Array.from(
          new Set([...(initialData?.serviceLocationIds || []), serviceLocationId])
        ),
      }

      await onSave(appt)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (initialData && onDelete) {
      await onDelete(initialData)
      onClose()
    }
  }

  // title override if client‐locked
  const clientLabel =
    options.clients?.find((c) => c.id === clientId)?.label || '—'
  const title = !showFields.client && isEdit
    ? `${clientLabel}'s Appointment`
    : isEdit
    ? 'Edit Appointment'
    : 'New Appointment'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* TYPE */}
          {showFields.type && (
            <TextField
              select
              label="Appointment Type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              fullWidth
              disabled={saving}
            >
              {options.types?.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* CLIENT */}
          {showFields.client ? (
            <TextField
              select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              fullWidth
              disabled={saving}
            >
              {options.clients?.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Box>
              <Typography variant="subtitle2">Client</Typography>
              <Typography variant="body1">{clientLabel}</Typography>
            </Box>
          )}

          {/* PROVIDER */}
          {showFields.provider && (
            <TextField
              select
              label="Service Provider"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              fullWidth
              disabled={saving}
            >
              {options.providers?.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* DATE & TIME */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={dateTime}
              onChange={setDateTime}
              disabled={saving}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        {isEdit && onDelete && (
          <Button color="error" onClick={handleDelete} disabled={saving}>
            Cancel Appointment
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
