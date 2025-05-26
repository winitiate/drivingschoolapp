import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { v4 as uuidv4 } from 'uuid';

import AppointmentTypeField from './AppointmentTypeField';
import ClientField from './ClientField';
import ProviderField from './ProviderField';
import type { Appointment } from '../../../models/Appointment';

export interface AdminAppointmentDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appt: Appointment) => Promise<void>;
  onDelete?: (appt: Appointment) => Promise<void>;
  clients: { id: string; label: string }[];
  providers: { id: string; label: string }[];
  types: { id: string; label: string }[];
}

export default function AdminAppointmentDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  onDelete,
  clients,
  providers,
  types,
}: AdminAppointmentDialogProps) {
  const isEdit = Boolean(initialData?.id);

  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [clientId, setClientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [dateTime, setDateTime] = useState<Date | null>(new Date());
  const [saving, setSaving] = useState(false);

  // Reset when opened or initialData changes
  useEffect(() => {
    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientId(initialData.clientId);
      setProviderId(initialData.serviceProviderId);
      if (initialData.date && initialData.time) {
        setDateTime(new Date(`${initialData.date}T${initialData.time}`));
      }
    } else {
      setAppointmentTypeId(types[0]?.id || '');
      setClientId(clients[0]?.id || '');
      setProviderId(providers[0]?.id || '');
      setDateTime(new Date());
    }
  }, [open, initialData, types, clients, providers]);

  const handleSave = async () => {
    if (!dateTime) return;
    setSaving(true);

    const dt = dateTime;
    const YYYY = dt.getFullYear();
    const MM = String(dt.getMonth() + 1).padStart(2, '0');
    const DD = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');

    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientId,
      serviceProviderId: providerId,
      date: `${YYYY}-${MM}-${DD}`,
      time: `${hh}:${mm}`,
      serviceLocationIds: Array.from(
        new Set([...(initialData?.serviceLocationIds || []), serviceLocationId])
      ),
    };

    await onSave(appt);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (initialData && onDelete) {
      await onDelete(initialData);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Appointment' : 'New Appointment'}
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          <AppointmentTypeField
            value={appointmentTypeId}
            onChange={setAppointmentTypeId}
            options={types}
            disabled={saving}
          />

          <ClientField
            value={clientId}
            onChange={setClientId}
            options={clients}
            disabled={saving}
          />

          <ProviderField
            value={providerId}
            onChange={setProviderId}
            options={providers}
            disabled={saving}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={dateTime}
              onChange={setDateTime}
              renderInput={params => <TextField {...params} fullWidth />}
              disabled={saving}
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
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
