// src/pages/Client/ClientDashboard.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import AppointmentFormDialog from '../../components/Appointments/AppointmentFormDialog';

import { FirestoreAppointmentStore } from '../../data/FirestoreAppointmentStore';
import { FirestoreServiceProviderStore } from '../../data/FirestoreServiceProviderStore';
import { FirestoreAppointmentTypeStore } from '../../data/FirestoreAppointmentTypeStore';
import { appointmentStore } from '../../data';

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { Appointment } from '../../models/Appointment';

export default function ClientDashboard() {
  const { id: locId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const db = useMemo(() => getFirestore(), []);

  // Firestore stores
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Enriched appointment list
  type Enriched = Appointment & {
    clientName: string;
    serviceProviderName: string;
    appointmentTypeName: string;
  };
  const [appointments, setAppointments] = useState<Enriched[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<Appointment | null>(null);

  // Fetch & enrich
  const loadAppointments = useCallback(async () => {
    if (!user?.uid || !locId) return;
    setLoading(true);
    setError(null);

    try {
      // 1) load all and filter to this client+location
      const all = await apptStore.listAll();
      const mine = all.filter(
        a =>
          a.clientId === user.uid &&
          // support both array or singular field
          (
            Array.isArray(a.serviceLocationIds)
              ? a.serviceLocationIds.includes(locId)
              : (a as any).serviceLocationId === locId
          )
      );

      // 2) build provider name map
      const provList = await providerStore.listByServiceLocation(locId);
      const provMap: Record<string,string> = {};
      await Promise.all(
        provList.map(async p => {
          const snap = await getDoc(doc(db, 'users', p.userId));
          const d = snap.exists() ? (snap.data() as any) : {};
          provMap[p.id!] = [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Unknown Provider';
        })
      );

      // 3) build type map
      const typeList = await typeStore.listByServiceLocation(locId);
      const typeMap: Record<string,string> = {};
      typeList.forEach(t => {
        if (t.id) typeMap[t.id] = t.title;
      });

      // 4) stitch it all together
      const enriched: Enriched[] = mine.map(a => ({
        ...a,
        clientName: `${user.firstName} ${user.lastName}`,
        serviceProviderName: provMap[a.serviceProviderId] || '(Any)',
        appointmentTypeName: typeMap[a.appointmentTypeId] || '',
      }));

      setAppointments(enriched);
    } catch (e: any) {
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user, locId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Dialog handlers
  const handleEdit = useCallback((appt: Appointment) => {
    setEditing(appt);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (updated: Appointment) => {
      await appointmentStore.save(updated);
      setDialogOpen(false);
      loadAppointments();
    },
    [loadAppointments]
  );

  const handleDelete = useCallback(
    async (toDelete: Appointment) => {
      await appointmentStore.delete(toDelete.id!);
      setDialogOpen(false);
      loadAppointments();
    },
    [loadAppointments]
  );

  // auth & param guards
  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!locId || !user.clientLocationIds?.includes(locId)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Client Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AppointmentsTable
        appointments={appointments}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onViewAssessment={appt =>
          navigate(`/client/${locId}/appointments/${appt.id}`)
        }
      />

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          component={RouterLink}
          to={`/client/${locId}/booking`}
          variant="contained"
        >
          Book An Appointment
        </Button>
      </Box>

      {dialogOpen && editing && (
        <AppointmentFormDialog
          open={dialogOpen}
          serviceLocationId={locId}
          initialData={editing}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          clients={[{ id: user.uid, label: `${user.firstName} ${user.lastName}` }]}
          serviceProviders={provList.map(p => ({
            id: p.id!,
            label: provMap[p.id!] || '(Any)',
          }))}
          appointmentTypes={typeList.map(t => ({
            id: t.id!,
            label: t.title,
          }))}
          canEditClient={false}
          canEditProvider={true}
          canEditAppointmentType={true}
          canEditDateTime={true}
          canCancel={true}
        />
      )}
    </Box>
  );
}
