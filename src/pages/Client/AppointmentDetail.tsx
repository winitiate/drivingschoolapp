// src/pages/Client/AppointmentDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';

import { FirestoreAppointmentStore } from '../../data/FirestoreAppointmentStore';
import type { Appointment } from '../../models/Appointment';
import AssessmentView from '../../components/Assessment/AssessmentView';

export default function AppointmentDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const store = new FirestoreAppointmentStore();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId) return;
    let mounted = true;

    store.getById(appointmentId)
      .then((appt) => {
        if (!appt) throw new Error('Appointment not found');
        if (mounted) setAppointment(appt);
      })
      .catch((e: any) => {
        console.error('Failed to load appointment:', e);
        if (mounted) setError(e.message || 'Failed to load appointment');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [appointmentId, store]);

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box textAlign="center" mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!appointment) {
    return (
      <Typography variant="body1" color="textSecondary" mt={4}>
        Appointment not found.
      </Typography>
    );
  }

  // Use the same date/time fields your table displays:
  const dateStr = (appointment as any).date ?? '—';
  const timeStr = (appointment as any).time ?? '—';

  return (
    <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Appointment Details
        </Typography>
        <Typography>
          <strong>Date:</strong> {dateStr}
        </Typography>
        <Typography>
          <strong>Time:</strong> {timeStr}
        </Typography>
        <Typography sx={{ mt: 1 }}>
          <strong>Status:</strong> {appointment.status}
        </Typography>
        {appointment.notes && (
          <Typography sx={{ mt: 1 }}>
            <strong>Notes:</strong> {appointment.notes}
          </Typography>
        )}
      </CardContent>

      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Your Assessment
        </Typography>
        <AssessmentView appointmentId={appointmentId!} />
      </Box>
    </Card>
  );
}
