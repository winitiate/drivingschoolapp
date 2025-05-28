// src/components/Appointments/AppointmentFormDialog.tsx

import React, { useState, useEffect } from 'react';
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
  Checkbox,
  ListItemText,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { v4 as uuidv4 } from 'uuid';
import { differenceInMinutes, addMinutes } from 'date-fns';

import type { Appointment } from '../../models/Appointment';

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
  onDelete?: (appt: Appointment) => Promise<void>;
  clients: Option[];
  serviceProviders: Option[];
  appointmentTypes: Option[];
  canEditClient?: boolean;
  canEditAppointmentType?: boolean;
  canEditProvider?: boolean;
  canEditDateTime?: boolean;
  canCancel?: boolean;
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
  const isEdit = Boolean(initialData?.id);

  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [serviceProviderIds, setServiceProviderIds] = useState<string[]>([]);
  const [appointmentStart, setAppointmentStart] = useState<Date | null>(new Date());
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(addMinutes(new Date(), 60));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds || []);
      setServiceProviderIds(initialData.serviceProviderIds || []);
      setAppointmentStart(new Date(initialData.startTime));
      setAppointmentEnd(new Date(initialData.endTime));
    } else {
      const now = new Date();
      setAppointmentTypeId(appointmentTypes[0]?.id || '');
      setClientIds(clients[0] ? [clients[0].id] : []);
      setServiceProviderIds(serviceProviders[0] ? [serviceProviders[0].id] : []);
      setAppointmentStart(now);
      setAppointmentEnd(addMinutes(now, 60));
    }
  }, [open, initialData, appointmentTypes, clients, serviceProviders]);

  const dialogTitle = isEdit ? 'Edit Appointment' : 'Add Appointment';

  const handleSubmit = async () => {
    if (!appointmentStart || !appointmentEnd) return;
    setSaving(true);

    const duration = differenceInMinutes(appointmentEnd, appointmentStart);

    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds,
      serviceLocationId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: duration,
      status: initialData?.status || 'scheduled',
      notes: initialData?.notes || '',
      metadata: initialData?.metadata || {},
    };

    try {
      await onSave(appt);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (initialData && onDelete) {
      setSaving(true);
      try {
        await onDelete(initialData);
        onClose();
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            select
            label="Appointment Type"
            value={appointmentTypeId}
            onChange={e => setAppointmentTypeId(e.target.value)}
            fullWidth
            disabled={!canEditAppointmentType}
          >
            {appointmentTypes.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {canEditClient ? (
            <TextField
              select
              multiple
              label="Client(s)"
              value={clientIds}
              onChange={e => setClientIds(e.target.value as string[])}
              fullWidth
              renderValue={selected =>
                (selected as string[])
                  .map(id => clients.find(c => c.id === id)?.label)
                  .join(', ')
              }
            >
              {clients.map(opt => (
                <MenuItem key={opt.id} value={opt.id}>
                  <Checkbox checked={clientIds.includes(opt.id)} />
                  <ListItemText primary={opt.label} />
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Box>
              <Typography variant="subtitle2">Client(s)</Typography>
              <Typography variant="body1">
                {clientIds.map(id => clients.find(c => c.id === id)?.label).join(', ')}
              </Typography>
            </Box>
          )}

          <TextField
            select
            multiple
            label="Service Provider(s)"
            value={serviceProviderIds}
            onChange={e => setServiceProviderIds(e.target.value as string[])}
            fullWidth
            disabled={!canEditProvider}
            renderValue={selected =>
              (selected as string[])
                .map(id => serviceProviders.find(sp => sp.id === id)?.label)
                .join(', ')
            }
          >
            {serviceProviders.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                <Checkbox checked={serviceProviderIds.includes(opt.id)} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Time"
              value={appointmentStart}
              onChange={setAppointmentStart}
              disabled={!canEditDateTime}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DateTimePicker
              label="End Time"
              value={appointmentEnd}
              onChange={setAppointmentEnd}
              disabled={!canEditDateTime}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        {isEdit && canCancel && onDelete && (
          <Button color="error" onClick={handleDelete} disabled={saving}>
            Cancel Appointment
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
