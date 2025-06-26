/**
 * CancelAppointmentDialog.tsx
 *
 * Prompts for fee acceptance (if any) and calls cancelAppointment().
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import type { Appointment } from "../../models/Appointment";
import {
  cancelAppointment,
  CancelAppointmentInput,
  CancelAppointmentResult,
} from "../../services";           // ← updated import path

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface Props {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onCancelled: (result: CancelAppointmentResult) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function CancelAppointmentDialog({
  open,
  appointment,
  onClose,
  onCancelled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [feeCents, setFeeCents] = useState(0);

  const configuredFee =
    (appointment.metadata?.cancellationFeeCents as number) ?? 0;

  /** First call – dry-run to see if a fee must be confirmed */
  const checkFee = useCallback(async () => {
    setLoading(true);
    setError(null);
    const input: CancelAppointmentInput = {
      appointmentId: appointment.id!,
      cancellationFeeCents: configuredFee,
    };
    try {
      const result = await cancelAppointment(input);
      if (result.requiresConfirmation) {
        setFeeCents(result.cancellationFeeCents ?? configuredFee);
        setNeedsConfirm(true);
      } else {
        onCancelled(result);
      }
    } catch (err: any) {
      setError(err.message || "Cancellation failed.");
    } finally {
      setLoading(false);
    }
  }, [appointment.id, configuredFee, onCancelled]);

  /** Runs every time the dialog is opened */
  useEffect(() => {
    if (open) {
      setNeedsConfirm(false);
      setError(null);
      checkFee();
    }
  }, [open, checkFee]);

  /** Second call – user accepted fee */
  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    const input: CancelAppointmentInput = {
      appointmentId: appointment.id!,
      cancellationFeeCents: feeCents,
      acceptCancellationFee: true,
    };
    try {
      const result = await cancelAppointment(input);
      onCancelled(result);
    } catch (err: any) {
      setError(err.message || "Cancellation failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cancel Appointment</DialogTitle>

      <DialogContent>
        {loading && (
          <Box textAlign="center" py={2}>
            <CircularProgress />
          </Box>
        )}

        {!loading && needsConfirm && (
          <Typography>
            A cancellation fee of ${(feeCents / 100).toFixed(2)} applies.
            Do you accept?
          </Typography>
        )}

        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        {needsConfirm && (
          <Button
            variant="contained"
            color="error"
            disabled={loading}
            onClick={handleAccept}
          >
            Accept Fee &amp; Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
