/**
 * src/components/Appointments/AppointmentFormDialog.tsx
 *
 * This client‐side dialog now uses an inline “Cancellation Reason” field
 * instead of window.prompt(…). When “Cancel Appointment” is clicked:
 *  1) An inline text field appears for the reason.
 *  2) Typing anything enables “Confirm Cancellation.”
 *  3) Clicking “Confirm Cancellation” issues a refund (if needed) and then
 *     performs a soft‐cancel by saving the appointment back with:
 *       status: "cancelled"
 *       cancellation: { time, reason, feeApplied: false }
 *
 * Props:
 *   • open: boolean
 *   • serviceLocationId: string
 *   • initialData?: Appointment
 *   • onClose(): void
 *   • onSave(appt: Appointment): Promise<void>
 *         – Used for both create/edit and soft‐cancel updates.
 *   • clients: Option[]
 *   • serviceProviders: Option[]
 *   • appointmentTypes: Option[]
 *   • canEditClient?: boolean
 *   • canEditAppointmentType?: boolean
 *   • canEditProvider?: boolean
 *   • canEditDateTime?: boolean
 *   • canCancel?: boolean
 *
 * NOTE: No window.prompt calls remain here.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { v4 as uuidv4 } from "uuid";
import { differenceInMinutes, addMinutes } from "date-fns";

import type { Appointment } from "../../models/Appointment";
import { cancelAppointment as callCancelAppointment } from "../../services/cancelAppointment";

export interface Option {
  id: string;
  label: string;
}

export interface AppointmentFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appt: Appointment) => Promise<void>;
  clients: Option[];
  serviceProviders: Option[];
  appointmentTypes: Option[];
  canEditClient?: boolean;
  canEditAppointmentType?: boolean;
  canEditProvider?: boolean;
  canEditDateTime?: boolean;
  canCancel?: boolean;
}

export default function AppointmentFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  clients,
  serviceProviders,
  appointmentTypes,
  canEditClient = true,
  canEditAppointmentType = true,
  canEditProvider = true,
  canEditDateTime = true,
  canCancel = true,
}: AppointmentFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  // ───────── Form fields ─────────
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>("");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [serviceProviderIds, setServiceProviderIds] = useState<string[]>([]);
  const [appointmentStart, setAppointmentStart] = useState<Date | null>(
    new Date()
  );
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(
    addMinutes(new Date(), 60)
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ───────── Cancellation UI State ─────────
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  // ───────── Reset when dialog opens or initialData changes ─────────
  useEffect(() => {
    if (!open) return;
    setError(null);
    setIsCancelling(false);
    setCancelReason("");

    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds || []);
      setServiceProviderIds(initialData.serviceProviderIds || []);
      setAppointmentStart(new Date(initialData.startTime));
      setAppointmentEnd(new Date(initialData.endTime));
    } else {
      const now = new Date();
      setAppointmentTypeId(appointmentTypes[0]?.id || "");
      setClientIds(clients[0] ? [clients[0].id] : []);
      setServiceProviderIds(
        serviceProviders[0] ? [serviceProviders[0].id] : []
      );
      setAppointmentStart(now);
      setAppointmentEnd(addMinutes(now, 60));
    }
  }, [
    open,
    initialData,
    appointmentTypes,
    clients,
    serviceProviders,
  ]);

  // ───────── Handle “Save” (create or edit) ─────────
  const handleSubmit = async () => {
    if (!appointmentStart || !appointmentEnd) return;
    setSaving(true);
    setError(null);

    const duration = differenceInMinutes(appointmentEnd, appointmentStart);
    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds,
      serviceLocationId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: duration,
      status: initialData?.status || "scheduled",
      notes: initialData?.notes || "",
      locationOverride: initialData?.locationOverride,
      customFields: initialData?.customFields,
      paymentId: initialData?.paymentId,
      cancellation: initialData?.cancellation,
      assessmentId: initialData?.assessmentId,
      metadata: initialData?.metadata,
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

  // ───────── Handle “Start Cancellation” ─────────
  const handleStartCancel = () => {
    setIsCancelling(true);
    setCancelReason("");
  };

  // ───────── Handle “Abort Cancellation” ─────────
  const handleAbortCancel = () => {
    setIsCancelling(false);
    setCancelReason("");
  };

  // ───────── Handle “Confirm Cancellation” ─────────
  const handleConfirmCancel = async () => {
    if (!initialData || !initialData.id) return;
    if (!cancelReason.trim()) {
      setError("A reason is required to cancel.");
      return;
    }

    setSaving(true);
    setError(null);

    // Pull paymentId + amountCents from metadata
    const pid = initialData.metadata?.paymentId as string | undefined;
    const cents = (initialData.metadata?.amountCents as number) || 0;

    try {
      // 1️⃣ Issue refund if paymentId exists
      if (pid) {
        await callCancelAppointment({
          appointmentId: initialData.id,
          paymentId: pid,
          amountCents: cents,
          reason: cancelReason.trim(),
        });
      }
      // 2️⃣ Soft‐cancel by saving an updated copy
      const updated: Appointment = {
        ...initialData,
        status: "cancelled",
        cancellation: {
          time: new Date(),
          reason: cancelReason.trim(),
          feeApplied: false,
        },
      };
      await onSave(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Cancellation / refund failed");
    } finally {
      setSaving(false);
      setIsCancelling(false);
    }
  };

  // ───────── Render ─────────
  const showCancelButton = isEdit && canCancel && !isCancelling;
  const confirmEnabled = Boolean(cancelReason.trim());

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Edit Appointment" : "Add Appointment"}
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
            disabled={!canEditAppointmentType || saving || isCancelling}
          >
            {appointmentTypes.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Client(s) */}
          {canEditClient ? (
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
          ) : (
            <Box>
              <Typography variant="subtitle2">Client(s)</Typography>
              <Typography variant="body1">
                {clientIds
                  .map((id) => clients.find((c) => c.id === id)?.label)
                  .join(", ")}
              </Typography>
            </Box>
          )}

          {/* Service Provider(s) */}
          <TextField
            select
            multiple
            label="Service Provider(s)"
            value={serviceProviderIds}
            onChange={(e) =>
              setServiceProviderIds(e.target.value as string[])
            }
            fullWidth
            disabled={!canEditProvider || saving || isCancelling}
            renderValue={(selected) =>
              (selected as string[])
                .map((id) => serviceProviders.find((sp) => sp.id === id)?.label)
                .join(", ")
            }
          >
            {serviceProviders.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                <Checkbox checked={serviceProviderIds.includes(opt.id)} />
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
              disabled={!canEditDateTime || saving || isCancelling}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DateTimePicker
              label="End Time"
              value={appointmentEnd}
              onChange={setAppointmentEnd}
              disabled={!canEditDateTime || saving || isCancelling}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          {/* Inline “Cancellation Reason” field */}
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
        {/* “Cancel Appointment” button (starts inline reason) */}
        {showCancelButton && (
          <Button
            color="error"
            onClick={handleStartCancel}
            disabled={saving}
          >
            Cancel Appointment
          </Button>
        )}

        {/* “Abort” and “Confirm Cancellation” buttons */}
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

        {/* “Close” / “Save” (hidden during cancellation) */}
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
