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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns }  from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { v4 as uuidv4 }     from 'uuid';

import type { Appointment } from '../../models/Appointment';

export interface Option { id: string; label: string }

interface Props {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appt: Appointment) => Promise<void>;
  appointmentTypes: Option[];
  serviceProviders: Option[];
  clientId: string;          // fixed for client
}

export default function ClientAppointmentDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  appointmentTypes,
  serviceProviders,
  clientId,
}: Props) {
  const isEdit = !!initialData?.id;

  const [typeId, setTypeId]             = useState('');
  const [providerId, setProviderId]     = useState('');
  const [dateTime, setDateTime]         = useState<Date|null>(new Date());
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    if (initialData) {
      setTypeId(initialData.appointmentTypeId);
      setProviderId(initialData.serviceProviderId);
      setDateTime(
        new Date(`${initialData.date}T${initialData.time}`)
      );
    } else {
      setTypeId(appointmentTypes[0]?.id || '');
      setProviderId(serviceProviders[0]?.id || '');
      setDateTime(new Date());
    }
  }, [open, initialData, appointmentTypes, serviceProviders]);

  const handleSubmit = async () => {
    if (!dateTime) return;
    setSaving(true);

    const iso = dateTime.toISOString();
    const [dateStr, timeWith] = iso.split('T');
    const timeStr = timeWith.slice(0,5);

    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId: typeId,
      clientId,
      serviceProviderId: providerId,
      date: dateStr,
      time: timeStr,
      serviceLocationIds: Array.from(new Set([
        ...(initialData?.serviceLocationIds||[]),
        serviceLocationId,
      ])),
    };

    await onSave(appt);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Appointment' : 'Book New Appointment'}
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Appointment Type */}
          <TextField
            select
            label="Appointment Type"
            value={typeId}
            onChange={e => setTypeId(e.target.value)}
            fullWidth
          >
            {appointmentTypes.map(o => (
              <MenuItem key={o.id} value={o.id}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Service Provider */}
          <TextField
            select
            label="Service Provider"
            value={providerId}
            onChange={e => setProviderId(e.target.value)}
            fullWidth
          >
            {serviceProviders.map(o => (
              <MenuItem key={o.id} value={o.id}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Date & Time */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={dateTime}
              onChange={setDateTime}
              renderInput={params => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
