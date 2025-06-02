/* eslint-disable react-hooks/exhaustive-deps */
/*  ────────────────────────────────────────────────────────────────
    Appointment create / edit dialog    (client & admin views share this)

    ✨ NEW IN THIS REVISION
      • “Cancel Appointment” button now     ⇒ prompts once for a reason
      • calls cancelAppointment() service   ⇒ triggers Cloud Function
      • shows basic error feedback
    ──────────────────────────────────────────────────────────────── */
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
import { cancelAppointment } from "../../services/cancelAppointment";

/* ─────────── props & option helpers ─────────── */
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
  /**  onDelete is still used for hard-delete (no refund) paths  */
  onDelete?: (appt: Appointment) => Promise<void>;
  clients: Option[];
  serviceProviders: Option[];
  appointmentTypes: Option[];
  canEditClient?: boolean;
  canEditAppointmentType?: boolean;
  canEditProvider?: boolean;
  canEditDateTime?: boolean;
  /**  When TRUE a Cancel-+-Refund button is shown  */
  canCancel?: boolean;
}

export default function AppointmentFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  onDelete,
  clients,
  serviceProviders,
  appointmentTypes,
  canEditClient = true,
  canEditAppointmentType = true,
  canEditProvider = true,
  canEditDateTime = true,
  canCancel = true,
}: AppointmentFormDialogProps) {
  /* ─────────── derived flags ─────────── */
  const isEdit = Boolean(initialData?.id);

  /* ─────────── form state ─────────── */
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [serviceProviderIds, setServiceProviderIds] = useState<string[]>([]);
  const [appointmentStart, setAppointmentStart] = useState<Date | null>(new Date());
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(addMinutes(new Date(), 60));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─────────── reset on open / initialData ─────────── */
  useEffect(() => {
    if (!open) return;

    setError(null);

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
      setServiceProviderIds(serviceProviders[0] ? [serviceProviders[0].id] : []);
      setAppointmentStart(now);
      setAppointmentEnd(addMinutes(now, 60));
    }
  }, [open, initialData, appointmentTypes, clients, serviceProviders]);

  /* Log component flags to verify Cancel-button should render */
  console.log("AppointmentFormDialog", {
    initialData,
    isEdit,
    canCancel,
    saving,
  });

  /* ─────────── handlers ─────────── */
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
      metadata: initialData?.metadata || {},
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

  /**  Handles the “Cancel Appointment” reimbursement flow  */
  const handleCancelWithRefund = async () => {
    console.log("Cancel button clicked", {
      appointmentId: initialData?.id,
      paymentId:     initialData?.metadata?.paymentId,
    });
    if (!initialData) return;

    // Prompt once for reason
    const reason = window.prompt("Please enter a cancellation reason:", "");
    if (reason === null) return; // user hit Cancel
    if (!reason.trim()) {
      window.alert("A reason is required to cancel & refund.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1) Call the Cloud Function → refund + mark “refunded” in Firestore
      await cancelAppointment({
        appointmentId: initialData.id!,
        paymentId:     initialData.metadata?.paymentId as string,
        amountCents:   initialData.metadata?.amountCents as number,
        reason:        reason.trim(),
      });

      // 2) optional local callback (e.g. remove from list)
      if (onDelete) await onDelete(initialData);

      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Cancellation / refund failed");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────── UI ─────────── */
  return (
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
          {/*  Appointment Type  */}
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

          {/*  Client(s)  */}
          {canEditClient ? (
            <TextField
              select
              multiple
              label="Client(s)"
              value={clientIds}
              onChange={(e) => setClientIds(e.target.value as string[])}
              fullWidth
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
                {clientIds.map((id) => clients.find((c) => c.id === id)?.label).join(", ")}
              </Typography>
            </Box>
          )}

          {/*  Service Provider(s)  */}
          <TextField
            select
            multiple
            label="Service Provider(s)"
            value={serviceProviderIds}
            onChange={(e) => setServiceProviderIds(e.target.value as string[])}
            fullWidth
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

          {/*  Date / time  */}
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
        {isEdit && canCancel && (
          <Button color="error" onClick={handleCancelWithRefund} disabled={saving}>
            Cancel Appointment
          </Button>
        )}

        <Box display="flex" gap={1}>
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
