// src/components/Appointments/AppointmentFormDialog.tsx

/**
 * AppointmentFormDialog.tsx
 *
 * Modal dialog for creating or editing an appointment.
 * - Selects client, service provider, appointment type, and date/time.
 * - Scopes the appointment to the given service location.
 * - Persists via the appointmentStore abstraction.
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • serviceLocationId: string — ID of the current service location  
 *  • initialData?: Appointment — existing data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(appointment: Appointment): void — callback after successful save  
 *  • clients: Array<{ id: string; name: string }>  
 *  • serviceProviders: Array<{ id: string; name: string }>  
 *  • appointmentTypes: Array<{ id: string; title: string }>  
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { v4 as uuidv4 } from 'uuid';

import type { Appointment } from '../../models/Appointment';
import { appointmentStore } from '../../data';

export interface AppointmentFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  clients: { id: string; name: string }[];
  serviceProviders: { id: string; name: string }[];
  appointmentTypes: { id: string; title: string }[];
}

export default function AppointmentFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  clients,
  serviceProviders,
  appointmentTypes,
}: AppointmentFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  const [clientId, setClientId] = useState('');
  const [serviceProviderId, setServiceProviderId] = useState('');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState<Date | null>(new Date());

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId);
      setServiceProviderId(initialData.serviceProviderId);
      setAppointmentTypeId(initialData.appointmentTypeId);
      if (initialData.date && initialData.time) {
        setAppointmentDateTime(new Date(`${initialData.date}T${initialData.time}`));
      }
    } else if (appointmentTypes.length === 1) {
      setAppointmentTypeId(appointmentTypes[0].id);
    }
  }, [initialData, appointmentTypes]);

  const handleSubmit = async () => {
    if (!appointmentDateTime) return;

    const dateStr = appointmentDateTime.toISOString().split('T')[0];
    const timeStr = appointmentDateTime.toISOString().split('T')[1].substring(0, 5);

    // Determine ID and serviceLocationIds
    const id = initialData?.id || uuidv4();
    const existingSLIds = initialData?.serviceLocationIds || [];
    const serviceLocationIds = Array.from(new Set([...existingSLIds, serviceLocationId]));

    const appointment: Appointment = {
      id,
      clientId,
      serviceProviderId,
      appointmentTypeId,
      date: dateStr,
      time: timeStr,
      serviceLocationIds,
    };

    // Persist via abstraction layer
    await appointmentStore.save(appointment);

    onSave(appointment);
    onClose();
  };

  const selectedClient = clients.find((c) => c.id === clientId) || null;
  const selectedProvider = serviceProviders.find((p) => p.id === serviceProviderId) || null;
  const selectedType = appointmentTypes.find((a) => a.id === appointmentTypeId) || null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Appointment' : 'Add Appointment'}
      </DialogTitle>
      <DialogContent dividers>
        <Autocomplete
          options={appointmentTypes}
          getOptionLabel={(opt) => opt.title}
          value={selectedType}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          onChange={(_, val) => setAppointmentTypeId(val?.id || '')}
          renderInput={(params) => (
            <TextField {...params} label="Appointment Type" margin="normal" fullWidth />
          )}
        />

        <Autocomplete
          options={clients}
          getOptionLabel={(opt) => opt.name}
          value={selectedClient}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          onChange={(_, val) => setClientId(val?.id || '')}
          renderInput={(params) => (
            <TextField {...params} label="Client" margin="normal" fullWidth />
          )}
        />

        <Autocomplete
          options={serviceProviders}
          getOptionLabel={(opt) => opt.name}
          value={selectedProvider}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          onChange={(_, val) => setServiceProviderId(val?.id || '')}
          renderInput={(params) => (
            <TextField {...params} label="Service Provider" margin="normal" fullWidth />
          )}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Date & Time"
            value={appointmentDateTime}
            onChange={setAppointmentDateTime}
            renderInput={(params) => <TextField {...params} margin="normal" fullWidth />}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
