// src/components/Appointments/AppointmentFormDialog.tsx

import React, { useState, useEffect, useMemo } from "react";
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
  Alert,
  CircularProgress,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { v4 as uuidv4 } from "uuid";
import { differenceInMinutes, addMinutes } from "date-fns";
import dayjs, { Dayjs } from "dayjs";

import ProviderSelect from "../../pages/Client/BookingPage/components/ProviderSelect";
import DateSelector   from "../../pages/Client/BookingPage/components/DateSelector";
import TimeSlots      from "../../pages/Client/BookingPage/components/TimeSlots";

import { useAvailabilities }  from "../../hooks/useAvailabilities";
import { useAppointmentsMap } from "../../hooks/useAppointmentsMap";
import { buildSlots }         from "../../utils/bookingUtils";

import { FirestoreAppointmentStore } from "../../data/FirestoreAppointmentStore";

import type { Appointment } from "../../models/Appointment";

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
  availabilityStore: any; // your FirestoreAvailabilityStore instance
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
  canEditClient            = true,
  canEditAppointmentType   = true,
  canEditProvider          = true,
  canEditDateTime          = true,
  canCancel                = true,
  availabilityStore,
}: AppointmentFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  // ───────── Core form state ─────────
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>("");
  const [clientIds,         setClientIds]         = useState<string[]>([]);
  const [serviceProviderId, setServiceProviderId] = useState<string>(""); // single
  const [appointmentStart,  setAppointmentStart]  = useState<Date | null>(
    new Date()
  );
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(
    addMinutes(new Date(), 60)
  );
  const [saving,  setSaving]  = useState<boolean>(false);
  const [error,   setError]   = useState<string | null>(null);

  // ───────── Cancellation UI ─────────
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  // ───────── Reschedule UI ─────────
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate,   setSelectedDate]   = useState<Dayjs | null>(null);
  const [slots,          setSlots]          = useState<any[]>([]);

  // ───────── Firestore hooks ─────────
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);

  // 1) Map your {id,label} array into {id,name} for ProviderSelect & hooks
  const providerOptions = useMemo(
    () =>
      serviceProviders.map((sp) => ({
        id: sp.id,
        name: sp.label,    // ProviderSelect & useAppointmentsMap expect `.name`
      })),
    [serviceProviders]
  );

  // 2) Subscribe to just this provider’s availability (or “any”)
  const chosenProvider = serviceProviderId || "any";
  const { availabilities, loading: availLoading } = useAvailabilities(
    chosenProvider,
    availabilityStore,
    providerOptions
  );

  // 3) Pass ISO‐string dates to useAppointmentsMap
  const apptsByDate = useAppointmentsMap(
    providerOptions,
    chosenProvider,
    apptStore,
    serviceLocationId,
    availableDates.map((d) => d.format("YYYY-MM-DD"))
  );

  // ───────── Reset form when dialog opens or initialData changes ─────────
  useEffect(() => {
    if (!open) return;

    setError(null);
    setSaving(false);
    setIsCancelling(false);
    setCancelReason("");
    setIsRescheduling(false);

    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds ?? []);
      setServiceProviderId(initialData.serviceProviderIds?.[0] || "");
      setAppointmentStart(new Date(initialData.startTime));
      setAppointmentEnd(new Date(initialData.endTime));
    } else {
      const now = new Date();
      setAppointmentTypeId(appointmentTypes[0]?.id ?? "");
      setClientIds(clients.length ? [clients[0].id] : []);
      setServiceProviderId(serviceProviders[0]?.id ?? "");
      setAppointmentStart(now);
      setAppointmentEnd(addMinutes(now, 60));
    }
  }, [open, initialData, appointmentTypes, clients, serviceProviders]);

  // ───────── Build calendar days when we enter Reschedule mode or the provider’s availability changes ─────────
  useEffect(() => {
    if (!isRescheduling || availLoading) return;

    // Clear and then compute the next 30 days that have slots
    const next30 = Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day"));
    const good = next30.filter((d) =>
      buildSlots(
        d,
        availabilities,
        providerOptions,
        apptsByDate,
        chosenProvider
      ).length > 0
    );
    setAvailableDates(good);
    setSelectedDate(good[0] ?? null);
  }, [
    isRescheduling,
    availLoading,
    availabilities,
    providerOptions,
    apptsByDate,
    chosenProvider,
  ]);

  // ───────── When the selectedDate changes, recompute that day’s slots ─────────
  useEffect(() => {
    if (!isRescheduling || !selectedDate) return;
    const daySlots = buildSlots(
      selectedDate,
      availabilities,
      providerOptions,
      apptsByDate,
      chosenProvider
    );
    setSlots(daySlots);
  }, [
    isRescheduling,
    selectedDate,
    availabilities,
    providerOptions,
    apptsByDate,
    chosenProvider,
  ]);

  // ───────── Submit (create / edit / reschedule) ─────────
  const handleSubmit = async () => {
    if (!appointmentStart || !appointmentEnd) return;
    setSaving(true);
    setError(null);

    const duration = differenceInMinutes(
      appointmentEnd,
      appointmentStart
    );

    const appt: Appointment = {
      id: initialData?.id ?? uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds: [serviceProviderId],
      serviceLocationId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: duration,
      status: initialData?.status ?? "scheduled",
      notes: initialData?.notes || "",
      cancellation: initialData?.cancellation,
      paymentId: initialData?.paymentId,
      assessmentId: initialData?.assessmentId,
      metadata: initialData?.metadata,
    };

    try {
      await onSave(appt);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ───────── Cancellation handlers ─────────
  const handleStartCancel = () => {
    setIsCancelling(true);
    setCancelReason("");
  };
  const handleAbortCancel = () => {
    setIsCancelling(false);
    setCancelReason("");
  };
  const handleConfirmCancel = async () => {
    if (!initialData?.id || !cancelReason.trim()) {
      setError("A reason is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
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
      setError(e.message ?? "Cancellation failed");
    } finally {
      setSaving(false);
      setIsCancelling(false);
    }
  };

  // ───────── UI flags ─────────
  const showCancelButton =
    isEdit && canCancel && !isCancelling && !isRescheduling;
  const cancelEnabled = Boolean(cancelReason.trim());

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isRescheduling
          ? "Reschedule Appointment"
          : isEdit
          ? "Edit Appointment"
          : "New Appointment"}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {saving && (
          <Box textAlign="center" my={2}>
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
            disabled={
              !canEditAppointmentType ||
              saving ||
              isCancelling ||
              isRescheduling
            }
          >
            {appointmentTypes.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Client */}
          <TextField
            select
            label="Client"
            value={clientIds[0] ?? ""}
            onChange={(e) => setClientIds([e.target.value])}
            fullWidth
            disabled={
              !canEditClient ||
              saving ||
              isCancelling ||
              isRescheduling
            }
          >
            {clients.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Service Provider */}
          {!isRescheduling && canEditProvider ? (
            <TextField
              select
              label="Service Provider"
              value={serviceProviderId}
              onChange={(e) => setServiceProviderId(e.target.value)}
              fullWidth
              disabled={saving || isCancelling}
            >
              {serviceProviders.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          ) : isRescheduling ? (
            <ProviderSelect
              providers={providerOptions}
              value={serviceProviderId}
              onChange={setServiceProviderId}
              disabled={saving}
            />
          ) : (
            <Box>
              <Typography variant="subtitle2">
                Service Provider
              </Typography>
              <Typography variant="body1">
                {
                  serviceProviders.find(
                    (sp) => sp.id === serviceProviderId
                  )?.label || "—"
                }
              </Typography>
            </Box>
          )}

          {/* Date/Time vs. Reschedule calendar */}
          {!isRescheduling ? (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={appointmentStart}
                onChange={setAppointmentStart}
                slotProps={{ textField: { fullWidth: true } }}
                disabled={
                  !canEditDateTime ||
                  saving ||
                  isCancelling
                }
              />
              <DateTimePicker
                label="End Time"
                value={appointmentEnd}
                onChange={setAppointmentEnd}
                slotProps={{ textField: { fullWidth: true } }}
                disabled={
                  !canEditDateTime ||
                  saving ||
                  isCancelling
                }
              />
            </LocalizationProvider>
          ) : (
            <>
              <DateSelector
                availableDates={availableDates}
                firstAvail={availableDates[0]}
                value={selectedDate}
                onChange={setSelectedDate}
              />
              <TimeSlots
                slots={slots}
                selectedDate={selectedDate}
                onSlotClick={(slot) => {
                  if (!selectedDate) return;
                  const base = selectedDate.toDate();
                  const [sh, sm] = slot.start
                    .split(":")
                    .map(Number);
                  const [eh, em] = slot.end
                    .split(":")
                    .map(Number);
                  const s = new Date(base);
                  s.setHours(sh, sm, 0, 0);
                  const e = new Date(base);
                  e.setHours(eh, em, 0, 0);
                  setAppointmentStart(s);
                  setAppointmentEnd(e);
                }}
              />
            </>
          )}

          {/* Inline Cancellation Reason */}
          {isCancelling && (
            <Box mt={2}>
              <Typography variant="subtitle1">
                Cancellation Reason
              </Typography>
              <TextField
                multiline
                minRows={2}
                value={cancelReason}
                onChange={(e) =>
                  setCancelReason(e.target.value)
                }
                placeholder="Reason for cancellation..."
                fullWidth
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
        {showCancelButton && (
          <Button
            color="error"
            onClick={handleStartCancel}
            disabled={saving}
          >
            Cancel Appointment
          </Button>
        )}

        {isEdit && !isCancelling && !isRescheduling && (
          <Button
            onClick={() => setIsRescheduling(true)}
            disabled={saving}
          >
            Reschedule Appointment
          </Button>
        )}

        {isCancelling && (
          <Box display="flex" gap={1}>
            <Button
              onClick={handleAbortCancel}
              disabled={saving}
            >
              Abort
            </Button>
            <Button
              color="error"
              onClick={handleConfirmCancel}
              disabled={!cancelEnabled || saving}
            >
              Confirm Cancellation
            </Button>
          </Box>
        )}

        {!isCancelling && (
          <Box display="flex" gap={1}>
            <Button onClick={onClose} disabled={saving}>
              {isRescheduling
                ? "Cancel Reschedule"
                : "Close"}
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
