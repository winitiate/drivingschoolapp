/**
 * AppointmentFormDialog.tsx
 * ------------------------------------------------------------
 * Dialog used by clients / staff to create or edit an appointment.
 *
 * ►  Cancellation is now delegated to the shared
 *    <CancelAppointmentDialog/> so the logic and Cloud-Function call
 *    are identical to any other cancellation flow in the app.
 *
 * Props: see `AppointmentFormDialogProps` below.
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
import CancelAppointmentDialog from "./CancelAppointmentDialog"; //  ← NEW import

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
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

  /* ───────── Form fields ───────── */
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>("");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [serviceProviderIds, setServiceProviderIds] = useState<string[]>([]);
  const [appointmentStart, setAppointmentStart] = useState<Date | null>(
    new Date()
  );
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(
    addMinutes(new Date(), 60)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ───────── Cancel-dialog state ───────── */
  const [cancelOpen, setCancelOpen] = useState(false);

  /* ───────── Reset when dialog opens / initialData changes ───────── */
  useEffect(() => {
    if (!open) return;

    setError(null);
    setCancelOpen(false);

    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds ?? []);
      setServiceProviderIds(initialData.serviceProviderIds ?? []);
      setAppointmentStart(new Date(initialData.startTime));
      setAppointmentEnd(new Date(initialData.endTime));
    } else {
      const now = new Date();
      setAppointmentTypeId(appointmentTypes[0]?.id ?? "");
      setClientIds(clients[0] ? [clients[0].id] : []);
      setServiceProviderIds(serviceProviders[0] ? [serviceProviders[0].id] : []);
      setAppointmentStart(now);
      setAppointmentEnd(addMinutes(now, 60));
    }
  }, [open, initialData, appointmentTypes, clients, serviceProviders]);

  /* ───────── Save (create / edit) ───────── */
  const handleSave = async () => {
    if (!appointmentStart || !appointmentEnd) return;

    setSaving(true);
    setError(null);

    const duration = differenceInMinutes(appointmentEnd, appointmentStart);

    const appt: Appointment = {
      id: initialData?.id ?? uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds,
      serviceLocationId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: duration,
      status: initialData?.status ?? "scheduled",
      notes: initialData?.notes ?? "",
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Cancellation flow helpers ───────── */
  const handleCancelClick = () => setCancelOpen(true);

  const handleCancelled = async (result: { appointment: Appointment }) => {
    // propagate updated doc to parent so any local state stays in sync
    await onSave(result.appointment);
    setCancelOpen(false);
    onClose();
  };

  /* ───────── Render ───────── */
  return (
    <>
      {/* ───────── Main Form Dialog ───────── */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEdit ? "Edit Appointment" : "Add Appointment"}</DialogTitle>

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
            {/* Appointment type */}
            <TextField
              select
              label="Appointment Type"
              value={appointmentTypeId}
              onChange={(e) => setAppointmentTypeId(e.target.value)}
              fullWidth
              disabled={!canEditAppointmentType || saving}
            >
              {appointmentTypes.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            {/* Clients */}
            {canEditClient ? (
              <TextField
                select
                multiple
                label="Client(s)"
                fullWidth
                value={clientIds}
                onChange={(e) => setClientIds(e.target.value as string[])}
                disabled={saving}
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

            {/* Service providers */}
            <TextField
              select
              multiple
              label="Service Provider(s)"
              fullWidth
              value={serviceProviderIds}
              onChange={(e) =>
                setServiceProviderIds(e.target.value as string[])
              }
              disabled={!canEditProvider || saving}
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

            {/* Date / time */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={appointmentStart}
                onChange={setAppointmentStart}
                disabled={!canEditDateTime || saving}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DateTimePicker
                label="End Time"
                value={appointmentEnd}
                onChange={setAppointmentEnd}
                disabled={!canEditDateTime || saving}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
          {/* Cancel-appointment button (opens secondary dialog) */}
          {isEdit && canCancel && (
            <Button
              color="error"
              disabled={saving}
              onClick={handleCancelClick}
            >
              Cancel Appointment
            </Button>
          )}

          {/* Close / Save */}
          <Box display="flex" gap={1}>
            <Button onClick={onClose} disabled={saving}>
              Close
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ───────── Secondary Cancel dialog ───────── */}
      {initialData && (
        <CancelAppointmentDialog
          open={cancelOpen}
          appointment={initialData}
          onClose={() => setCancelOpen(false)}
          onCancelled={handleCancelled}
        />
      )}
    </>
  );
}
