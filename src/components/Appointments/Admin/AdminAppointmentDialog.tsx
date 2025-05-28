// src/components/Appointments/Admin/AdminAppointmentDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { v4 as uuidv4 } from "uuid";
import { differenceInMinutes, addMinutes } from "date-fns";

import AppointmentTypeField from "./AppointmentTypeField";
import ClientField from "./ClientField";
import ProviderField from "./ProviderField";
import type { Appointment } from "../../../models/Appointment";

export interface AdminAppointmentDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appt: Appointment) => Promise<void>;
  onDelete?: (appt: Appointment) => Promise<void>;
  clients: { id: string; label: string }[];
  providers: { id: string; label: string }[];
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

  /* ───────── form state ───────── */
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [providerIds, setProviderIds] = useState<string[]>([]);
  const [startDT, setStartDT] = useState<Date | null>(new Date());
  const [endDT, setEndDT] = useState<Date | null>(addMinutes(new Date(), 60));
  const [saving, setSaving] = useState(false);

  /* ───────── reset on open / initialData ───────── */
  useEffect(() => {
    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds ?? []);
      setProviderIds(initialData.serviceProviderIds ?? []);
      setStartDT(initialData.startTime ? new Date(initialData.startTime) : new Date());
      setEndDT(initialData.endTime ? new Date(initialData.endTime) : addMinutes(new Date(), 60));
    } else {
      setAppointmentTypeId(types[0]?.id || "");
      setClientIds(clients[0] ? [clients[0].id] : []);
      setProviderIds(providers[0] ? [providers[0].id] : []);
      const now = new Date();
      setStartDT(now);
      setEndDT(addMinutes(now, 60));
    }
  }, [open, initialData, clients, providers, types]);

  /* ───────── handlers ───────── */
  const handleSave = async () => {
    if (!startDT || !endDT) return;
    setSaving(true);

    const duration = differenceInMinutes(endDT, startDT);

    const appt: Appointment = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds: providerIds,
      serviceLocationId,
      startTime: startDT,
      endTime: endDT,
      durationMinutes: duration,
      status: initialData?.status || "scheduled",
      notes: initialData?.notes || "",
    };

    await onSave(appt);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (initialData && onDelete) {
      setSaving(true);
      await onDelete(initialData);
      setSaving(false);
      onClose();
    }
  };

  /* ───────── render ───────── */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Appointment" : "New Appointment"}</DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          <AppointmentTypeField
            value={appointmentTypeId}
            onChange={setAppointmentTypeId}
            options={types}
            disabled={saving}
          />

          <ClientField
            multiple
            value={clientIds}
            onChange={setClientIds}
            options={clients}
            disabled={saving}
          />

          <ProviderField
            multiple
            value={providerIds}
            onChange={setProviderIds}
            options={providers}
            disabled={saving}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Time"
              value={startDT}
              onChange={(d) => {
                setStartDT(d);
                if (d && endDT && d >= endDT)
                  setEndDT(addMinutes(d, 60));
              }}
              disabled={saving}
            />
            <DateTimePicker
              label="End Time"
              value={endDT}
              minDateTime={startDT || undefined}
              onChange={setEndDT}
              disabled={saving}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
        {isEdit && onDelete && (
          <Button color="error" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        )}

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
  );
}
