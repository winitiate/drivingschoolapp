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
import AppointmentFormDialog, { Option } from '../../components/Appointments/AppointmentFormDialog';

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

  // 1) Load the service-provider’s display name
  useEffect(() => {
    if (!serviceProviderId) return;
    providerStore
      .getById(serviceProviderId)
      .then((prov) =>
        prov
          ? getDoc(doc(db, 'users', prov.userId)).then((snap) => {
              if (snap.exists()) {
                const d = snap.data() as any;
                const full = [d.firstName, d.lastName].filter(Boolean).join(' ');
                if (full) setProviderName(full);
              }
            })
          : Promise.resolve()
      )
      .catch(() => {});
  }, [serviceProviderId, providerStore, db]);

  // 2) Reload appointments + build client/type maps
  const reload = useCallback(async () => {
    if (!serviceProviderId) return;
    setLoading(true);
    setError(null);

    try {
      // fetch all appointments, filter to this provider
      const all = await apptStore.listAll();
      const mine = all.filter(a => a.serviceProviderId === serviceProviderId);

      // --- CLIENTS: unique clientId list from appointments ---
      const clientIds = Array.from(new Set(mine.map(a => a.clientId)));

      const clientOpts: Option[] = await Promise.all(
        clientIds.map(async id => {
          // try your clientStore first
          const cEnt = await clientStore.getById(id);
          if (cEnt) {
            // found a client document → lookup the linked `users/{userId}`
            const snap = await getDoc(doc(db, 'users', cEnt.userId));
            const d = snap.exists() ? (snap.data() as any) : {};
            const label = [d.firstName, d.lastName].filter(Boolean).join(' ');
            return { id, label: label || 'Unnamed Client' };
          } else {
            // fallback: treat `id` as a direct users/{id}
            const snap = await getDoc(doc(db, 'users', id));
            if (snap.exists()) {
              const d = snap.data() as any;
              const label = [d.firstName, d.lastName].filter(Boolean).join(' ');
              return { id, label: label || 'Unnamed Client' };
            }
            return { id, label: 'Unknown Client' };
          }
        })
      );
      const clientNameMap = Object.fromEntries(clientOpts.map(c => [c.id, c.label]));

      // --- TYPES: fetch all for these service locations (your existing logic) ---
      const locIds = Array.from(new Set(mine.flatMap(a => a.serviceLocationIds || [])));
      const typeLists = await Promise.all(locIds.map(loc => typeStore.listByServiceLocation(loc)));
      const typeMap = new Map<string, { id: string; title: string }>();
      typeLists.flat().forEach(t => {
        if (t.id && !typeMap.has(t.id)) typeMap.set(t.id, t);
      });
      const typeOpts: Option[] = Array.from(typeMap.values()).map(t => ({
        id: t.id!,
        label: t.title,
      }));

      // --- Enrich appointments for your table ---
      const enriched = mine.map(a => ({
        ...a,
        clientName: clientNameMap[a.clientId] || 'Unknown Client',
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
  }, [serviceProviderId, apptStore, clientStore, typeStore, providerStore, db, providerName]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 3) Handlers: save, delete, then reload
  const handleSave = async (appt: Appointment) => {
    await apptStore.save(appt);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };
  const handleDelete = async (appt: Appointment) => {
    await deleteDoc(doc(db, 'appointments', appt.id!));
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  // 4) Render
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          {providerName}’s Appointments
        </Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          New Appointment
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !appointments.length ? (
        <Typography>No appointments found.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={a => { setEditing(a); setDialogOpen(true); }}
          onAssess={a =>
            navigate(`/service-provider/${serviceProviderId}/appointments/${a.id}/assess`)
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
