/**
 * src/components/Appointments/Admin/AdminAppointmentDialog.tsx
 *
 * This dialog component allows an administrator to create, edit, or cancel a single appointment.
 * It uses an inline “Cancellation Reason” field instead of a window.prompt. When the admin clicks
 * “Cancel Appointment,” an input appears for the reason; typing a reason enables “Confirm Cancellation.”
 * Confirming will:
 *   1) Issue a refund via cancelAppointment Cloud Function if `metadata.paymentId` exists.
 *   2) Soft‐cancel the appointment by invoking onDelete(updatedAppointment) with:
 *        status: "cancelled"
 *        cancellation: { time, reason, whoCancelled?, feeApplied: false }
 *
 * Props:
 *   • open: boolean
 *   • serviceLocationId: string
 *   • initialData?: Appointment
 *   • onClose(): void
 *   • onSave(appt: Appointment): Promise<void>
 *   • onDelete(appt: Appointment): Promise<void>
 *         – Called after any refund (if paid) or immediately if unpaid. Parent must persist changes:
 *             appointment.status = "cancelled"
 *             appointment.cancellation = { time, reason, whoCancelled?, feeApplied: false }
 *   • clients: Option[]
 *   • providers: Option[]
 *   • types: { id: string; label: string; durationMinutes?: number }[]
 */

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { v4 as uuidv4 } from "uuid";
import { differenceInMinutes, addMinutes } from "date-fns";

import type { Appointment } from "../../../models/Appointment";
import { cancelAppointment as callCancelAppointment } from "../../../services/cancelAppointment";

export interface Option {
  id: string;
  label: string;
}

export interface AdminAppointmentDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appt: Appointment) => Promise<void>;
  /**
   * Called after refund (if metadata.paymentId existed) or immediately (if unpaid).
   * Parent should persist changes to Firestore:
   *   appointment.status = "cancelled"
   *   appointment.cancellation = { time, reason, whoCancelled?, feeApplied:false }
   */
  onDelete: (appt: Appointment) => Promise<void>;
  clients: Option[];
  providers: Option[];
  types: { id: string; label: string; durationMinutes?: number }[];
}

export default function AdminAppointmentDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  onDelete,
  clients,
  providers,
  types,
}: AdminAppointmentDialogProps) {
  const isEdit = Boolean(initialData?.id);

  /* ───────── Form State ───────── */
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>("");  
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [providerIds, setProviderIds] = useState<string[]>([]);
  const [appointmentStart, setAppointmentStart] = useState<Date | null>(new Date());
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(addMinutes(new Date(), 60));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* ───────── Cancellation UI State ───────── */
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  /* ───────── Reset on Open / initialData Change ───────── */
  useEffect(() => {
    if (!open) return;
    setError(null);
    setIsCancelling(false);
    setCancelReason("");

    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds ?? []);
      setProviderIds(initialData.serviceProviderIds ?? []);
      setAppointmentStart(
        initialData.startTime ? new Date(initialData.startTime) : new Date()
      );
      setAppointmentEnd(
        initialData.endTime 
          ? new Date(initialData.endTime) 
          : addMinutes(new Date(), 60)
      );
    } else {
      // “New” mode defaults
      setAppointmentTypeId(types[0]?.id || "");
      setClientIds(clients[0] ? [clients[0].id] : []);
      setProviderIds(providers[0] ? [providers[0].id] : []);
      const now = new Date();
      setAppointmentStart(now);
      setAppointmentEnd(addMinutes(now, 60));
    }
  }, [open, initialData, clients, providers, types]);

  /* ───────── Save Handler ───────── */
  const handleSubmit = async () => {
    if (!appointmentStart || !appointmentEnd) return;
    setSaving(true);
    setError(null);

    const duration = differenceInMinutes(appointmentEnd, appointmentStart);

    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds: providerIds,
      serviceLocationId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: duration,
      status: initialData?.status || "scheduled",
      notes: initialData?.notes || "",
      metadata: initialData?.metadata || {},
      paymentId: initialData?.paymentId,
      cancellation: initialData?.cancellation,
      assessmentId: initialData?.assessmentId,
      customFields: initialData?.customFields,
      locationOverride: initialData?.locationOverride,
    };

    try {
      await onSave(appt);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save appointment");
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Begin Cancellation Flow ───────── */
  const handleStartCancel = () => {
    setIsCancelling(true);
    setCancelReason("");
  };

  /* ───────── Abort Cancellation ───────── */
  const handleAbortCancel = () => {
    setIsCancelling(false);
    setCancelReason("");
  };

  /* ───────── Confirm Cancellation ───────── */
  const handleConfirmCancel = async () => {
    if (!initialData || !initialData.id) return;
    if (!cancelReason.trim()) {
      setError("A cancellation reason is required.");
      return;
    }

    setSaving(true);
    setError(null);

    // Read paymentId and amountCents from metadata (like client version)
    const pid = initialData.metadata?.paymentId as string | undefined;
    const cents = (initialData.metadata?.amountCents as number) || 0;

    try {
      if (pid) {
        // Call Cloud Function to refund
        await callCancelAppointment({
          appointmentId: initialData.id,
          paymentId: pid,
          amountCents: cents,
          reason: cancelReason.trim(),
        });
      }
      // Soft‐cancel locally
      const updated: Appointment = {
        ...initialData,
        status: "cancelled",
        cancellation: {
          time: new Date(),
          reason: cancelReason.trim(),
          feeApplied: pid ? false : false,
          whoCancelled: undefined,
        },
      };
      await onDelete(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Cancellation/refund failed");
    } finally {
      setSaving(false);
      setIsCancelling(false);
    }
  };

  /* ───────── Helpers ───────── */
  const showCancelButton = isEdit && !isCancelling;
  const confirmEnabled = Boolean(cancelReason.trim());

  /* ───────── Render ───────── */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Edit Appointment" : "New Appointment"}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {saving && (
          <Box textAlign="center" mt={1} mb={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          {/* Appointment Type */}
          <TextField
            select
            label="Appointment Type"
            value={appointmentTypeId}
            onChange={(e) => setAppointmentTypeId(e.target.value)}
            fullWidth
            disabled={saving || isCancelling}
          >
            {types.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Client(s) */}
          <TextField
            select
            multiple
            label="Client(s)"
            value={clientIds}
            onChange={(e) => setClientIds(e.target.value as string[])}
            fullWidth
            disabled={saving || isCancelling}
            renderValue={(selected) =>
              (selected as string[])
                .map((id) => clients.find((c) => c.id === id)?.label)
                .join(", ")
            }
          >
            {clients.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                <Checkbox checked={clientIds.includes(opt.id)} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </TextField>

          {/* Provider(s) */}
          <TextField
            select
            multiple
            label="Provider(s)"
            value={providerIds}
            onChange={(e) => setProviderIds(e.target.value as string[])}
            fullWidth
            disabled={saving || isCancelling}
            renderValue={(selected) =>
              (selected as string[])
                .map((id) => providers.find((p) => p.id === id)?.label)
                .join(", ")
            }
          >
            {providers.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                <Checkbox checked={providerIds.includes(opt.id)} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </TextField>

          {/* Date / Time Pickers */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Time"
              value={appointmentStart}
              onChange={setAppointmentStart}
              disabled={saving || isCancelling}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DateTimePicker
              label="End Time"
              value={appointmentEnd}
              onChange={setAppointmentEnd}
              disabled={saving || isCancelling}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          {/* Inline Cancellation Reason */}
          {isCancelling && (
            <Box mt={2}>
              <Typography variant="subtitle1" gutterBottom>
                Cancellation Reason
              </Typography>
              <TextField
                multiline
                minRows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                fullWidth
                disabled={saving}
                placeholder="Enter the reason for cancellation..."
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
        {/* “Cancel Appointment” button */}
        {showCancelButton && (
          <Button
            color="error"
            onClick={handleStartCancel}
            disabled={saving}
          >
            Cancel Appointment
          </Button>
        )}

        {/* “Abort” and “Confirm Cancellation” buttons (only when isCancelling) */}
        {isCancelling && (
          <Box display="flex" gap={1}>
            <Button
              color="inherit"
              onClick={handleAbortCancel}
              disabled={saving}
            >
              Abort
            </Button>
            <Button
              color="error"
              onClick={handleConfirmCancel}
              disabled={!confirmEnabled || saving}
            >
              Confirm Cancellation
            </Button>
          </Box>
        )}

        {/* “Save” / “Close” buttons (hidden during cancellation) */}
        {!isCancelling && (
          <Box display="flex" gap={1}>
            <Button onClick={onClose} disabled={saving}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
            >
              Save
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}
