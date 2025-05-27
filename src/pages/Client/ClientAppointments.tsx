// src/pages/Client/ClientAppointments.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import ClientAppointmentDialog from '../../components/Appointments/ClientAppointmentDialog';

import { FirestoreAppointmentStore } from '../../data/FirestoreAppointmentStore';
import type { Appointment } from '../../models/Appointment';

export default function ClientAppointments() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apptStore = new FirestoreAppointmentStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment|null>(null);

  const reload = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await apptStore.listByClient(clientId);
      setAppointments(raw);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [clientId, apptStore]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = async (a: Appointment) => {
    await apptStore.save(a);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">My Appointments</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Book New
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : appointments.length === 0 ? (
        <Typography>No appointments found.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={a => { setEditing(a); setDialogOpen(true); }}
          onViewAssessment={a =>
            navigate(`/client/${clientId}/appointments/${a.id}`)
          }
        />
      )}

      <ClientAppointmentDialog
        open={dialogOpen}
        serviceLocationId={appointments[0]?.serviceLocationIds?.[0] || ''}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        appointmentTypes={[]}     /* load as needed */
        serviceProviders={[]}     /* load as needed */
        clientId={clientId!}
      />
    </Box>
  );
}
