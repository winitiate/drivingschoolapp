// src/pages/Client/ClientAppointments.tsx

/**
 * ClientAppointments.tsx
 *
 * Client-side appointment list and soft-cancel handler.
 *
 * • Lists every appointment for the current client.
 * • “Cancel” now performs a soft-cancel (status → "cancelled", adds cancellation metadata)
 *   instead of deleting the document.
 * • Issues refunds via cancelAppointment Cloud Function if needed.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { FirestoreAppointmentTypeStore } from '../../data/FirestoreAppointmentTypeStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import type { Appointment } from '../../models/Appointment';

export default function ClientAppointments() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const functions = getFunctions();
  const auth = getAuth();

  // Local state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  // Reload client appointments (no status filter here, so cancelled ones remain visible)
  const reload = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);

    try {
      // 1) Fetch raw appointments for this client
      const raw = await apptStore.listByClient(clientId);

      // 2) Enrich with appointmentTypeName
      //    a) Gather unique serviceLocationIds
      const locIds = Array.from(
        new Set(raw.map((a) => a.serviceLocationId))
      );

      //    b) Load types for each location
      const typeLists = await Promise.all(
        locIds.map((loc) =>
          typeStore.listByServiceLocation(loc).catch(() => [])
        )
      );

      //    c) Build a map: typeId → title
      const typeMap = new Map<string, string>();
      typeLists.flat().forEach((t) => {
        if (t.id && t.title) {
          typeMap.set(t.id, t.title);
        }
      });

      //    d) Attach appointmentTypeName (fallback to “—”)
      const enriched = raw.map((a) => ({
        ...a,
        appointmentTypeName: typeMap.get(a.appointmentTypeId) || '—',
      }));

      setAppointments(enriched);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [clientId, apptStore, typeStore]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Save (create/edit) handler:
  const handleSave = async (a: Appointment) => {
    await apptStore.save(a);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  /**
   * handleCancel
   * • Prompts the client for a cancellation reason.
   * • Soft-cancels (status = "cancelled", adds `cancellation` metadata) instead of hard-delete.
   * • If there's a paymentId, calls the Cloud Function `cancelAppointment` first.
   */
  const handleCancel = async (appt: Appointment) => {
    const reason = window.prompt('Please enter a cancellation reason:', '');
    if (reason === null) return; // user aborted
    if (!reason.trim()) {
      window.alert('A reason is required to cancel.');
      return;
    }

    const currentUser = auth.currentUser;
    const whoCancelled = currentUser?.uid || 'unknown';

    setLoading(true);
    setError(null);

    try {
      // If there's a paymentId, issue refund
      const pid = (appt.metadata as any)?.paymentId as string | undefined;
      const cents = ((appt.metadata as any)?.amountCents as number) || 0;
      if (pid) {
        const cancelFn = httpsCallable<
          {
            appointmentId: string;
            paymentId: string;
            amountCents: number;
            reason: string;
          },
          { success: boolean; refund: any }
        >(functions, 'cancelAppointment');

        await cancelFn({
          appointmentId: appt.id!,
          paymentId: pid,
          amountCents: cents,
          reason: reason.trim(),
        });
      }

      // Soft-cancel in Firestore
      const updated: Appointment = {
        ...appt,
        status: 'cancelled',
        cancellation: {
          time: new Date(),
          reason: reason.trim(),
          feeApplied: false,
          whoCancelled,
        },
      };
      await apptStore.save(updated);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Cancellation/refund failed');
    } finally {
      setLoading(false);
      await reload();
    }
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
          onEdit={(a) => {
            setEditing(a);
            setDialogOpen(true);
          }}
          onViewAssessment={(a) =>
            navigate(`/client/${clientId}/appointments/${a.id}`)
          }
          onDelete={handleCancel} // “Cancel” now does a soft-cancel
        />
      )}

      <ClientAppointmentDialog
        open={dialogOpen}
        // default to the first appointment's location, or empty string
        serviceLocationId={
          appointments.length > 0
            ? appointments[0].serviceLocationId
            : ''
        }
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        // You can load and pass in actual lists here if desired:
        appointmentTypes={[]}
        serviceProviders={[]}
        clientId={clientId!}
      />
    </Box>
  );
}
