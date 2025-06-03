/**
 * src/pages/Client/ClientAppointments.tsx
 *
 * Client-side appointment list and soft-cancel handler.
 *
 * • Lists every appointment for the current client.
 * • “Cancel” now performs a soft-cancel (status → "cancelled", adds cancellation metadata)
 *   instead of deleting the document.
 * • Issues refunds via cancelAppointment Cloud Function if needed.
 */

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
import { getFunctions, httpsCallable }       from 'firebase/functions';
import { getAuth }                           from 'firebase/auth';
import type { Appointment }                  from '../../models/Appointment';

export default function ClientAppointments() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apptStore = new FirestoreAppointmentStore();
  const functions = getFunctions();
  const auth      = getAuth();

  // Local state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState<boolean>(true);
  const [error,        setError]        = useState<string|null>(null);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing,    setEditing]    = useState<Appointment|null>(null);

  // Reload client appointments (no status filter here, so cancelled ones remain visible)
  const reload = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      // Note: listByClient should not filter out cancelled appointments
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

  // Save (create/edit) handler:
  const handleSave = async (a: Appointment) => {
    await apptStore.save(a);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  /**
   * handleCancel
   * • Prompts the client for a cancellation reason (window.prompt).
   * • If there is no paymentId, immediately soft-cancels:
   *     – status = "cancelled"
   *     – cancellation = { time, reason, feeApplied:false, whoCancelled }
   *     – saved with apptStore.save(...)
   * • If there is a paymentId:
   *     1) Calls the `cancelAppointment` callable to refund.
   *     2) On success, does the same soft-cancel update.
   *
   * After either path, reloads the appointment list. At no point do we delete().
   */
  const handleCancel = async (appt: Appointment) => {
    // (1) Prompt for a reason
    const reason = window.prompt("Please enter a cancellation reason:", "");
    if (reason === null) {
      // User hit “Cancel” on the prompt → abort
      return;
    }
    if (!reason.trim()) {
      window.alert("A reason is required to cancel.");
      return;
    }

    // (2) Determine who is performing the cancellation
    const currentUser = auth.currentUser;
    const whoCancelled = currentUser?.uid || 'unknown';

    setLoading(true);
    setError(null);

    try {
      // (3) If a paymentId exists in metadata, issue a refund first
      const pid = appt.metadata?.paymentId as string|undefined;
      const cents = (appt.metadata?.amountCents as number) || 0;
      if (pid) {
        const cancelFn = httpsCallable<
          { appointmentId: string; paymentId: string; amountCents: number; reason: string },
          { success: boolean; refund: { refundId: string; status: string } }
        >(functions, 'cancelAppointment');

        console.log('handleCancel → calling cancelAppointment callable', {
          appointmentId: appt.id,
          paymentId: pid,
          amountCents: cents,
          reason: reason.trim(),
        });
        await cancelFn({
          appointmentId: appt.id!,
          paymentId: pid,
          amountCents: cents,
          reason: reason.trim(),
        });
        console.log('handleCancel → refund succeeded');
      } else {
        console.log('handleCancel → no paymentId, skipping refund');
      }

      // (4) Soft-cancel the appointment in Firestore
      const updated: Appointment = {
        ...appt,
        status: 'cancelled',
        cancellation: {
          time: new Date(),
          reason: reason.trim(),
          feeApplied: pid ? false : false,
          whoCancelled,
        },
      };
      await apptStore.save(updated);
      console.log('handleCancel → appointment marked “cancelled”');
    } catch (e: any) {
      console.error('handleCancel → error:', e);
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
          onEdit={a => {
            setEditing(a);
            setDialogOpen(true);
          }}
          onViewAssessment={a =>
            navigate(`/client/${clientId}/appointments/${a.id}`)
          }
          onDelete={handleCancel}  // ← “Cancel” calls soft-cancel
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
