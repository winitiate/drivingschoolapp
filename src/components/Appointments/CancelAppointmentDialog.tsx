/**
 * src/components/Appointments/CancelAppointmentDialog.tsx
 *
 * Two-phase cancellation flow shared by Admin & Client UIs.
 *
 * 1. User supplies a **cancellation reason**.
 * 2. We dry-run `cancelAppointment` → server tells us whether a fee applies.
 * 3. If a fee is required, the user must accept it.
 * 4. We re-call the CF with `acceptCancellationFee = true`.
 *
 * The component always returns an object that includes `.appointment`
 * so parents can safely persist the updated document.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  TextField,
} from '@mui/material';

import type { Appointment } from '../../models/Appointment';
import {
  cancelAppointment,
  CancelAppointmentInput,
  CancelAppointmentResult,
} from '../../services';

interface Props {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onCancelled: (
    res: CancelAppointmentResult & { appointment: Appointment }
  ) => void;
}

export default function CancelAppointmentDialog({
  open,
  appointment,
  onClose,
  onCancelled,
}: Props) {
  /* ───── Local state ────────────────────────────────────────────── */
  const [reason, setReason]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [feeCents, setFeeCents]         = useState(0);

  /* ───── Reset every time the dialog opens ──────────────────────── */
  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
      setNeedsConfirm(false);
      setFeeCents(0);
    }
  }, [open]);

  /* ───── Helper: always return .appointment for the caller ──────── */
  const ensureAppointment = useCallback(
    (
      res: CancelAppointmentResult
    ): CancelAppointmentResult & { appointment: Appointment } => {
      if ('appointment' in res) return res as any;

      const synthetic: Appointment = {
        ...appointment,
        status: 'cancelled',
        cancellation: {
          time: new Date(),
          reason: reason.trim(),
          feeApplied: (res.cancellationFeeCents ?? feeCents) > 0,
        },
      };
      return { ...res, appointment: synthetic };
    },
    [appointment, reason, feeCents]
  );

  /* ───── 1st call: dry-run ──────────────────────────────────────── */
  const runDryRun = async () => {
    setLoading(true);
    setError(null);

    const baseFee =
      (appointment.metadata?.cancellationFeeCents as number) ?? 0;

    const input: CancelAppointmentInput = {
      appointmentId: appointment.id!,
      cancellationFeeCents: baseFee,
      reason: reason.trim(),
    };

    try {
      const res = await cancelAppointment(input);

      if (res.requiresConfirmation) {
        setFeeCents(res.cancellationFeeCents ?? baseFee);
        setNeedsConfirm(true);
      } else {
        onCancelled(ensureAppointment(res));
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err ?? 'Cancellation failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ───── 2nd call: user accepted fee ────────────────────────────── */
  const runFinalCancel = async () => {
    setLoading(true);
    setError(null);

    const input: CancelAppointmentInput = {
      appointmentId: appointment.id!,
      cancellationFeeCents: feeCents,
      acceptCancellationFee: true,
      reason: reason.trim(),
    };

    try {
      const res = await cancelAppointment(input);
      onCancelled(ensureAppointment(res));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err ?? 'Cancellation failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ───── Derived flags ──────────────────────────────────────────── */
  const reasonValid = Boolean(reason.trim());

  /* ───── Render ─────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cancel Appointment</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}

        {loading && (
          <Box textAlign="center" my={2}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !needsConfirm && (
          <TextField
            label="Cancellation Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            autoFocus
          />
        )}

        {!loading && needsConfirm && (
          <Typography>
            A cancellation fee of ${(feeCents / 100).toFixed(2)} applies.
            Do you accept?
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>

        {!needsConfirm ? (
          <Button
            variant="contained"
            color="error"
            onClick={runDryRun}
            disabled={!reasonValid || loading}
          >
            Cancel Appointment
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={runFinalCancel}
            disabled={loading}
          >
            Accept Fee&nbsp;&amp;&nbsp;Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
