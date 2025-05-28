// src/pages/ServiceLocation/Appointments/AppointmentsManager.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';

import AdminAppointmentDialog from '../../../components/Appointments/Admin/AdminAppointmentDialog';
import AppointmentsTable from '../../../components/Appointments/AppointmentsTable';
import { FirestoreAppointmentStore } from '../../../data/FirestoreAppointmentStore';
import { FirestoreClientStore } from '../../../data/FirestoreClientStore';
import { FirestoreServiceProviderStore } from '../../../data/FirestoreServiceProviderStore';
import { FirestoreAppointmentTypeStore } from '../../../data/FirestoreAppointmentTypeStore';

import type { Appointment } from '../../../models/Appointment';

export default function AppointmentsManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const db = useMemo(() => getFirestore(), []);

  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore = useMemo(() => new FirestoreClientStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientsRaw, setClientsRaw] = useState<{ id: string; userId: string }[]>([]);
  const [providersRaw, setProvidersRaw] = useState<{ id: string; userId: string }[]>([]);
  const [typesRaw, setTypesRaw] = useState<{ id: string; title: string }[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [providerMap, setProviderMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      const all = await apptStore.listAll();
      const forLoc = all.filter(a =>
        a.serviceLocationIds?.includes(serviceLocationId)
      );

      const [cl, pr, tp] = await Promise.all([
        clientStore.listByServiceLocation(serviceLocationId),
        providerStore.listByServiceLocation(serviceLocationId),
        typeStore.listByServiceLocation(serviceLocationId),
      ]);

      const cMap: Record<string, string> = {};
      await Promise.all(
        cl.map(async c => {
          const snap = await getDoc(doc(db, 'users', c.userId));
          const d = snap.exists() ? snap.data() : {};
          cMap[c.id] =
            [d?.firstName, d?.lastName].filter(Boolean).join(' ') ||
            'Unknown Client';
        })
      );

      const pMap: Record<string, string> = {};
      await Promise.all(
        pr.map(async p => {
          const snap = await getDoc(doc(db, 'users', p.userId));
          const d = snap.exists() ? snap.data() : {};
          pMap[p.id] =
            [d?.firstName, d?.lastName].filter(Boolean).join(' ') ||
            'Unknown Provider';
        })
      );

      const enriched = forLoc.map(a => ({
        ...a,
        clientName: a.clientIds?.map(id => cMap[id] || 'Unknown Client').join(', '),
        serviceProviderName: a.serviceProviderIds?.map(id => pMap[id] || 'Unknown Provider').join(', '),
      }));

      setAppointments(enriched);
      setClientsRaw(cl);
      setProvidersRaw(pr);
      setTypesRaw(tp);
      setClientMap(cMap);
      setProviderMap(pMap);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [
    serviceLocationId,
    apptStore,
    clientStore,
    providerStore,
    typeStore,
    db,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);

  const clientOpts = clientsRaw.map(c => ({
    id: c.id,
    label: clientMap[c.id] || 'Unknown Client',
  }));
  const providerOpts = providersRaw.map(p => ({
    id: p.id,
    label: providerMap[p.id] || 'Unknown Provider',
  }));
  const typeOpts = typesRaw.map(t => ({
    id: t.id,
    label: t.title,
  }));

  const handleSave = async (a: Appointment) => {
    await apptStore.save(a);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  const handleDelete = async (a: Appointment) => {
    await deleteDoc(doc(db, 'appointments', a.id));
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Appointments</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Appointment
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Typography>No appointments for this location.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={a => {
            setEditing(a);
            setDialogOpen(true);
          }}
        />
      )}

      <AdminAppointmentDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        clients={clientOpts}
        providers={providerOpts}
        types={typeOpts}
      />
    </Box>
  );
}
