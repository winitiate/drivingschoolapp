// src/pages/Client/ClientDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  useParams,
  useNavigate,
  Navigate,
  Link as RouterLink,
} from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';

import { useAuth } from '../../auth/useAuth';
import { useClientAppointments } from '../../hooks/useClientAppointments';

import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import AppointmentFormDialog from '../../components/Appointments/AppointmentFormDialog';

import { FirestoreClientStore } from '../../data/FirestoreClientStore';
import { FirestoreServiceProviderStore } from '../../data/FirestoreServiceProviderStore';
import { FirestoreAppointmentTypeStore } from '../../data/FirestoreAppointmentTypeStore';
import { appointmentStore } from '../../data';

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { Appointment } from '../../models/Appointment';

type Option = { id: string; label: string };

export default function ClientDashboard() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // load this client's appointments
  const {
    appointments,
    loading: apptLoading,
    error: apptError,
  } = useClientAppointments(user?.uid || '', clientId || '');

  // dropdown options
  const [clientOpt, setClientOpt] = useState<Option | null>(null);
  const [providerOpts, setProviderOpts] = useState<Option[]>([]);
  const [typeOpts, setTypeOpts] = useState<Option[]>([]);

  const db = getFirestore();

  // fetch client, providers, types
  useEffect(() => {
    if (!user?.uid || !clientId) return;

    const clientStore = new FirestoreClientStore();
    const providerStore = new FirestoreServiceProviderStore();
    const typeStore = new FirestoreAppointmentTypeStore();

    (async () => {
      // your existing logic to set clientOpt, providerOpts, typeOpts
      const allClients = await clientStore.listByServiceLocation(clientId);
      const me = allClients.find(c => c.userId === user.uid);
      if (me) {
        const snap = await getDoc(doc(db, 'users', me.userId));
        const d = snap.exists() ? snap.data() : {};
        const name = `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'You';
        setClientOpt({ id: me.id!, label: name });
      }

      const rawProviders = await providerStore.listByServiceLocation(clientId);
      const provs = await Promise.all(
        rawProviders.map(async p => {
          const snap = await getDoc(doc(db, 'users', p.userId));
          const d = snap.exists() ? snap.data() : {};
          const name = `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Provider';
          return { id: p.id!, label: name };
        })
      );
      setProviderOpts(provs);

      const rawTypes = await typeStore.listByServiceLocation(clientId);
      setTypeOpts(rawTypes.map(t => ({ id: t.id!, label: t.title })));
    })();
  }, [user?.uid, clientId, db]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const handleEdit = useCallback((appt: Appointment) => {
    setEditing(appt);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (updated: Appointment) => {
      await appointmentStore.save(updated);
      setDialogOpen(false);
    },
    []
  );

  const handleDelete = useCallback(
    async (toDelete: Appointment) => {
      await appointmentStore.delete(toDelete.id!);
      setDialogOpen(false);
    },
    []
  );

  // guard loading/auth
  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!clientId) return <Navigate to="/" replace />;

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Client Dashboard
      </Typography>

      {apptError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apptError}
        </Alert>
      )}

      <AppointmentsTable
        appointments={appointments}
        loading={apptLoading}
        error={apptError || null}
        onEdit={handleEdit}
        onViewAssessment={(appt) =>
          navigate(`/client/${clientId}/appointments/${appt.id}`)
        }
      />

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button component={RouterLink} to={`/client/${clientId}/booking`} variant="contained">
          Book An Appointment
        </Button>
      </Box>

      {dialogOpen && editing && clientOpt && (
        <AppointmentFormDialog
          open={dialogOpen}
          serviceLocationId={clientId}
          initialData={editing}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          clients={[clientOpt]}
          serviceProviders={providerOpts}
          appointmentTypes={typeOpts}
          canEditClient={false}
          canEditAppointmentType={true}
          canEditProvider={true}
          canEditDateTime={true}
          canCancel={true}
        />
      )}
    </Box>
  );
}
