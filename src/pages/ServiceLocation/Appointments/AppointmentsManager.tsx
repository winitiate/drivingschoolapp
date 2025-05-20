// src/pages/ServiceLocation/Appointments/AppointmentsManager.tsx

/**
 * AppointmentsManager.tsx
 *
 * Admin interface for managing appointments at a specific service location.
 * - Uses the AppointmentStore abstraction to load all appointments,
 *   then filters by serviceLocationId.
 * - Uses ClientStore, ServiceProviderStore, AppointmentTypeStore
 *   abstractions to load related entities, scoped by serviceLocationId.
 * - Enriches appointments with clientName and serviceProviderName.
 * - Renders AppointmentsTable and AppointmentFormDialog.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import AppointmentFormDialog from '../../../components/Appointments/AppointmentFormDialog';
import AppointmentsTable from '../../../components/Appointments/AppointmentsTable';

import { FirestoreAppointmentStore } from '../../../data/FirestoreAppointmentStore';
import { FirestoreClientStore } from '../../../data/FirestoreClientStore';
import { FirestoreServiceProviderStore } from '../../../data/FirestoreServiceProviderStore';
import { FirestoreAppointmentTypeStore } from '../../../data/FirestoreAppointmentTypeStore';

import type { Appointment } from '../../../models/Appointment';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function AppointmentsManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const db = useMemo(() => getFirestore(), []);

  // Use the abstraction stores
  const appointmentStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore = useMemo(() => new FirestoreClientStore(), []);
  const serviceProviderStore = useMemo(
    () => new FirestoreServiceProviderStore(),
    []
  );
  const appointmentTypeStore = useMemo(
    () => new FirestoreAppointmentTypeStore(),
    []
  );

  // Local state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [serviceProviders, setServiceProviders] = useState<
    { id: string; name: string }[]
  >([]);
  const [types, setTypes] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Load all appointments, then filter by serviceLocationId
      const all = await appointmentStore.listAll();
      const apptsForLocation = all.filter((a) =>
        a.serviceLocationIds?.includes(serviceLocationId)
      );

      // 2. Load clients, providers, types scoped to this location
      const [clientList, providerList, typeList] = await Promise.all([
        clientStore.listByServiceLocation(serviceLocationId),
        serviceProviderStore.listByServiceLocation(serviceLocationId),
        appointmentTypeStore.listByServiceLocation(serviceLocationId),
      ]);

      // 3. Resolve client names
      const clientsWithNames = await Promise.all(
        clientList.map(async (c) => {
          const snap = await getDoc(doc(db, 'users', c.id));
          const data = snap.exists() ? snap.data() : {};
          return {
            id: c.id,
            name:
              `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
              'Unnamed Client',
          };
        })
      );

      // 4. Resolve provider names
      const providersWithNames = await Promise.all(
        providerList.map(async (p) => {
          const snap = await getDoc(doc(db, 'users', p.id));
          const data = snap.exists() ? snap.data() : {};
          return {
            id: p.id,
            name:
              `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
              'Unnamed Provider',
          };
        })
      );

      // 5. Prepare appointment types
      const typesList = typeList.map((t) => ({
        id: t.id,
        title: t.title,
      }));

      // 6. Build lookup maps
      const clientMap = Object.fromEntries(
        clientsWithNames.map((c) => [c.id, c.name])
      );
      const providerMap = Object.fromEntries(
        providersWithNames.map((p) => [p.id, p.name])
      );

      // 7. Enrich appointments
      const enriched = apptsForLocation.map((a) => ({
        ...a,
        clientName: clientMap[a.clientId] || 'Unknown Client',
        serviceProviderName:
          providerMap[a.serviceProviderId] || 'Unknown Provider',
      }));

      // 8. Update state
      setAppointments(enriched);
      setClients(clientsWithNames);
      setServiceProviders(providersWithNames);
      setTypes(typesList);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [
    appointmentStore,
    clientStore,
    serviceProviderStore,
    appointmentTypeStore,
    serviceLocationId,
    db,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = async (data: Partial<Appointment>) => {
    if (!serviceLocationId) return;
    try {
      const base = editing || ({ serviceLocationIds: [] } as Appointment);
      const merged: Appointment = {
        ...(base.id ? base : (data as Appointment)),
        ...data,
        serviceLocationIds: Array.from(
          new Set([...(base.serviceLocationIds || []), serviceLocationId])
        ),
      };
      await appointmentStore.save(merged);
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box textAlign="center">
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Typography>No appointments for this location.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={(appt) => {
            setEditing(appt);
            setDialogOpen(true);
          }}
        />
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        clients={clients}
        serviceProviders={serviceProviders}
        appointmentTypes={types}
      />
    </Box>
  );
}
