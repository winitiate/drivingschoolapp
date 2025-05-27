// src/pages/ServiceProvider/ServiceProviderAppointments.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';

import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import AppointmentFormDialog, {
  Option,
} from '../../components/Appointments/AppointmentFormDialog';

import { FirestoreAppointmentStore } from '../../data/FirestoreAppointmentStore';
import { FirestoreClientStore } from '../../data/FirestoreClientStore';
import { FirestoreAppointmentTypeStore } from '../../data/FirestoreAppointmentTypeStore';
import { FirestoreServiceProviderStore } from '../../data/FirestoreServiceProviderStore';

import type { Appointment } from '../../models/Appointment';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';

export default function ServiceProviderAppointments() {
  const { serviceProviderId } = useParams<{ serviceProviderId: string }>();
  const navigate = useNavigate();
  const db = useMemo(() => getFirestore(), []);

  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore = useMemo(() => new FirestoreClientStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);

  const [providerName, setProviderName] = useState('Service Provider');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  // load provider name
  useEffect(() => {
    if (!serviceProviderId) return;
    providerStore
      .getById(serviceProviderId)
      .then((prov) => {
        if (!prov) return;
        return getDoc(doc(db, 'users', prov.userId));
      })
      .then((snap) => {
        if (snap?.exists()) {
          const d = snap.data() as any;
          const full = [d.firstName, d.lastName].filter(Boolean).join(' ');
          if (full) setProviderName(full);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [serviceProviderId, providerStore, db]);

  // reload appointments + dropdown data
  const reload = useCallback(async () => {
    if (!serviceProviderId) return;
    setLoading(true);
    setError(null);

    try {
      const all = await apptStore.listAll();
      const mine = all.filter(
        (a) => a.serviceProviderId === serviceProviderId
      );

      // gather every location you teach at
      const locIds = Array.from(
        new Set(mine.flatMap((a) => a.serviceLocationIds || []))
      );

      // load clients & types from each location
      const [clientLists, typeLists] = await Promise.all([
        ...locIds.map((loc) => clientStore.listByServiceLocation(loc)),
        ...locIds.map((loc) => typeStore.listByServiceLocation(loc)),
      ]);

      // dedupe helper
      const uniqueById = <T extends { id: string }>(arrs: T[][]): T[] => {
        const m = new Map<string, T>();
        arrs.flat().forEach((x) => {
          if (!m.has(x.id)) m.set(x.id, x);
        });
        return Array.from(m.values());
      };

      const clientEntities = uniqueById(clientLists);
      const typeEntities = uniqueById(typeLists);

      // build client dropdown options
      const clientOpts: Option[] = await Promise.all(
        clientEntities.map(async (c) => {
          const snap = await getDoc(doc(db, 'users', c.userId));
          const d = snap.exists() ? (snap.data() as any) : {};
          const name =
            [d.firstName, d.lastName].filter(Boolean).join(' ') ||
            'Unnamed Client';
          return { id: c.id, label: name };
        })
      );

      // build type dropdown options
      const typeOpts: Option[] = typeEntities.map((t) => ({
        id: t.id,
        label: t.title,
      }));

      // enrich your appts for display
      const cMap = Object.fromEntries(
        clientOpts.map((c) => [c.id, c.label])
      );
      const enriched = mine.map((a) => ({
        ...a,
        clientName: cMap[a.clientId] || 'Unknown Client',
        serviceProviderName: providerName,
      }));

      setAppointments(enriched);
      setClients(clientOpts);
      setTypes(typeOpts);
    } catch (e: any) {
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [serviceProviderId, apptStore, clientStore, typeStore, db, providerName]);

  useEffect(() => {
    reload();
  }, [reload]);

  // save (create/update)
  const handleSave = async (appt: Appointment) => {
    await apptStore.save(appt);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  // cancel (delete)
  const handleDelete = async (appt: Appointment) => {
    await deleteDoc(doc(db, 'appointments', appt.id!));
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Service Provider {providerName} Appointments
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          New Appointment
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
          onEdit={(a) => {
            setEditing(a);
            setDialogOpen(true);
          }}
          onAssess={(a) =>
            navigate(
              `/service-provider/${serviceProviderId}/appointments/${a.id}/assess`
            )
          }
        />
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        serviceLocationId={appointments[0]?.serviceLocationIds?.[0] || ''}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        clients={clients}
        serviceProviders={[{ id: serviceProviderId!, label: providerName }]}
        appointmentTypes={types}
        canEditClient={false}
        canEditProvider={false}
        canCancel={Boolean(editing)}
      />
    </Box>
  );
}
