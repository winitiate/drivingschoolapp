// src/components/AppointmentTypes/AppointmentTypeFormDialog.tsx

/**
 * AppointmentTypeFormDialog.tsx
 *
 * Modal dialog for creating or editing an appointment type.
 * - Captures title, description, duration, price, and order.
 * - Scopes the appointment type to the given serviceLocationId.
 * - Persists immediately via the appointmentTypeStore abstraction.
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • serviceLocationId: string — ID of the current service location  
 *  • initialData?: AppointmentType | null — existing data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(at: AppointmentType): void — callback after successful save  
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import type { AppointmentType } from '../../models/AppointmentType';
import { appointmentTypeStore } from '../../data';

export interface AppointmentTypeFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: AppointmentType | null;
  onClose: () => void;
  onSave: (appointmentType: AppointmentType) => void;
}

export default function AppointmentTypeFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: AppointmentTypeFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [order, setOrder] = useState<number | ''>('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? '');
      setDurationMinutes(initialData.durationMinutes ?? '');
      setPrice(initialData.price ?? '');
      setOrder(initialData.order ?? '');
    } else {
      setTitle('');
      setDescription('');
      setDurationMinutes('');
      setPrice('');
      setOrder('');
    }
  }, [initialData]);

  const handleSubmit = async () => {
    const at: AppointmentType = {
      id: initialData?.id || uuidv4(),
      serviceLocationId,
      title,
      description,
      durationMinutes: durationMinutes === '' ? undefined : Number(durationMinutes),
      price: price === '' ? undefined : Number(price),
      order: order === '' ? undefined : Number(order),
    };

    // Persist via the abstraction layer
    await appointmentTypeStore.save(at);

    // Notify parent
    onSave(at);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Appointment Type' : 'Add Appointment Type'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Duration (minutes)"
              type="number"
              fullWidth
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Price"
              type="number"
              fullWidth
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Order (optional)"
              type="number"
              fullWidth
              value={order}
              onChange={(e) =>
                setOrder(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </Grid>
        </Grid>
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
