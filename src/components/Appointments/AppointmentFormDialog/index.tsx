/**
 * src/components/Appointments/AppointmentFormDialog/index.tsx
 *
 * Unified Edit + Reschedule dialog:
 *  - Always shows Appointment Type, Client, and Service Provider selectors (with “Any”).
 *  - Edit/New mode: side-by-side DateTimePickers (editable by role).
 *  - Reschedule mode: inline DateCalendar (green-border days) + time‐slot buttons.
 * 
 * Optional fields (cancellation, paymentId, assessmentId, metadata) are only
 * added if defined—so Firestore never sees `undefined`.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { differenceInMinutes, addMinutes } from "date-fns";

import type { DailySlot } from "../../../models/Availability";
import { AppointmentFormDialogProps } from "./types";
import { CoreFields } from "./CoreFields";
import { CancelSection } from "./CancelSection";
import { useAuth } from "../../../auth/useAuth";
import { FirestoreAppointmentStore } from "../../../data/FirestoreAppointmentStore";
import { useAvailabilities } from "../../../hooks/useAvailabilities";
import { useAppointmentsMap } from "../../../hooks/useAppointmentsMap";
import { buildSlots } from "../../../utils/bookingUtils";

export default function AppointmentFormDialog({
  open,
  initialData,
  serviceLocationId,
  onClose,
  onSave,
  onDelete,
  clients,
  serviceProviders,
  appointmentTypes,
  canCancel = true,
  availabilityStore,
}: AppointmentFormDialogProps) {
  const { user, roles = {} } = useAuth();
  const locationRoles: string[] = roles[serviceLocationId] ?? [];

  // Who can edit date/time?
  const canEditDateTime = useMemo(
    () =>
      ["serviceProvider", "serviceLocationAdmin", "businessOwner"].some((r) =>
        locationRoles.includes(r)
      ),
    [locationRoles]
  );

  const isEdit = Boolean(initialData?.id);
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);

  // Inject “Any” at top of service provider list
  const providersWithAny = useMemo(
    () => [{ id: "any", label: "(Any)" }, ...serviceProviders],
    [serviceProviders]
  );

  // Core form state
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>("");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [serviceProviderId, setServiceProviderId] = useState<string>("any");
  const [appointmentStart, setAppointmentStart] = useState<Date | null>(
    new Date()
  );
  const [appointmentEnd, setAppointmentEnd] = useState<Date | null>(
    addMinutes(new Date(), 60)
  );

  // UI flags
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Which time‐slot is clicked
  const [selectedSlot, setSelectedSlot] = useState<DailySlot | null>(null);

  // Build next‐30‐days
  const next30 = useMemo(
    () => Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day")),
    []
  );

  // Firestore hooks for availabilities + appointments
  const providerOptions = providersWithAny.map((sp) => ({
    id: sp.id,
    name: sp.label,
  }));
  const chosenProvider = serviceProviderId;
  const { availabilities, loading: availLoading } = useAvailabilities(
    chosenProvider,
    availabilityStore,
    providerOptions
  );
  const apptsByDate = useAppointmentsMap(
    providerOptions,
    chosenProvider,
    apptStore,
    serviceLocationId,
    next30.map((d) => d.format("YYYY-MM-DD"))
  );

  // State for calendar + slot selection in reschedule mode
  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [slots, setSlots] = useState<DailySlot[]>([]);

  // Initialize form controls when dialog opens or initialData changes
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    setIsCancelling(false);
    setIsRescheduling(false);
    setSelectedSlot(null);

    if (initialData) {
      setAppointmentTypeId(initialData.appointmentTypeId);
      setClientIds(initialData.clientIds ?? []);
      setServiceProviderId(initialData.serviceProviderIds[0] || "any");
      setAppointmentStart(new Date(initialData.startTime));
      setAppointmentEnd(new Date(initialData.endTime));
    } else {
      setAppointmentTypeId(appointmentTypes[0]?.id || "");
      setClientIds(clients.map((c) => c.id).slice(0, 1));
      setServiceProviderId("any");
      setAppointmentStart(new Date());
      setAppointmentEnd(addMinutes(new Date(), 60));
    }

    setAvailableDates([]);
    setSelectedDate(null);
    setSlots([]);
  }, [open, initialData]);

  // Compute availableDates when entering reschedule mode
  useEffect(() => {
    if (!isRescheduling || availLoading) return;

    const filtered = next30.filter((day) => {
      if (day.isBefore(dayjs(), "day")) return false;
      return (
        buildSlots(
          day,
          availabilities,
          providerOptions,
          apptsByDate,
          chosenProvider
        ).length > 0
      );
    });
    setAvailableDates(filtered);
    setSelectedDate(filtered[0] || null);
  }, [isRescheduling, availLoading, availabilities]);

  // Compute slots any time selectedDate changes
  useEffect(() => {
    if (!isRescheduling || !selectedDate) {
      setSlots([]);
      return;
    }
    setSlots(
      buildSlots(
        selectedDate,
        availabilities,
        providerOptions,
        apptsByDate,
        chosenProvider
      )
    );
  }, [isRescheduling, selectedDate, availabilities, apptsByDate]);

  // ————————————
  // Save / Submit handler
  // ————————————
  const handleSubmit = async () => {
    if (!appointmentStart || !appointmentEnd) return;
    setSaving(true);
    setError(null);

    const duration = differenceInMinutes(
      appointmentEnd,
      appointmentStart
    );

    // Build core appointment payload
    const newAppt: any = {
      id: initialData?.id || uuidv4(),
      appointmentTypeId,
      clientIds,
      serviceProviderIds: [serviceProviderId],
      serviceLocationId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: duration,
      status: initialData?.status || "scheduled",
      notes: initialData?.notes || "",
    };

    // Only include optional fields if they’re defined
    if (initialData?.cancellation !== undefined) {
      newAppt.cancellation = initialData.cancellation;
    }
    if (initialData?.paymentId !== undefined) {
      newAppt.paymentId = initialData.paymentId;
    }
    if (initialData?.assessmentId !== undefined) {
      newAppt.assessmentId = initialData.assessmentId;
    }
    if (initialData?.metadata !== undefined) {
      newAppt.metadata = initialData.metadata;
    }

    try {
      await onSave(newAppt);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // —————————————————————
  // Confirm Cancellation
  // —————————————————————
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setError("A reason is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (initialData) await onDelete?.(initialData);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
      setIsCancelling(false);
    }
  };

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
        {error && <Alert severity="error">{error}</Alert>}
        {saving && (
          <Box textAlign="center">
            <CircularProgress />
          </Box>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack spacing={2}>
            {/* selectors */}
            <CoreFields
              appointmentTypeId={appointmentTypeId}
              clientIds={clientIds}
              serviceProviderId={serviceProviderId}
              appointmentTypes={appointmentTypes}
              clients={clients}
              serviceProviders={providersWithAny}
              canEditAppointmentType={false}
              canEditClient={false}
              canEditProvider={!isEdit || isRescheduling}
              showProviderPicker
              onChangeType={setAppointmentTypeId}
              onChangeClient={setClientIds}
              onChangeProvider={setServiceProviderId}
            />

            {isRescheduling ? (
              <>
                <Typography variant="h6">Select a date</Typography>
                <DateCalendar
                  value={selectedDate!}
                  onChange={(d) => d && setSelectedDate(dayjs(d))}
                  disablePast
                  shouldDisableDate={(day) =>
                    !availableDates.some((d) =>
                      d.isSame(day, "day")
                    )
                  }
                  slots={{
                    day: (props) => {
                      const ok = availableDates.some((d) =>
                        d.isSame(props.day, "day")
                      );
                      return (
                        <PickersDay
                          {...props}
                          disabled={!ok}
                          sx={{
                            ...(ok && {
                              border: "2px solid green",
                              borderRadius: "50%",
                            }),
                          }}
                        />
                      );
                    },
                  }}
                />

                <Typography variant="h6">Select a time</Typography>
                {slots.length === 0 ? (
                  <Alert severity="info">
                    No time slots available on this day.
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    {slots.map((slot) => {
                      const isSel =
                        selectedSlot?.start === slot.start &&
                        selectedSlot?.end === slot.end;
                      return (
                        <Button
                          key={`${slot.start}-${slot.end}`}
                          variant={isSel ? "contained" : "outlined"}
                          onClick={() => {
                            setSelectedSlot(slot);
                            const base = selectedDate!.toDate();
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
                        >
                          {`${slot.start} - ${slot.end}`}
                        </Button>
                      );
                    })}
                  </Stack>
                )}
              </>
            ) : (
              <Stack direction="row" spacing={2}>
                <DateTimePicker
                  label="Start Time"
                  value={appointmentStart}
                  onChange={setAppointmentStart}
                  fullWidth
                  disabled={!canEditDateTime}
                />
                <DateTimePicker
                  label="End Time"
                  value={appointmentEnd}
                  onChange={setAppointmentEnd}
                  fullWidth
                  disabled={!canEditDateTime}
                />
              </Stack>
            )}
          </Stack>
        </LocalizationProvider>

        {isCancelling && (
          <CancelSection
            cancelReason={cancelReason}
            onChange={setCancelReason}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between" }}>
        {!isRescheduling && canCancel && isEdit && !isCancelling && (
          <Button
            color="error"
            onClick={() => setIsCancelling(true)}
          >
            Cancel Appointment
          </Button>
        )}
        {!isRescheduling && isEdit && !isCancelling && (
          <Button onClick={() => setIsRescheduling(true)}>
            Reschedule Appointment
          </Button>
        )}
        {isCancelling && (
          <Box display="flex" gap={2}>
            <Button onClick={() => setIsCancelling(false)}>
              Abort
            </Button>
            <Button
              color="error"
              onClick={handleConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </Box>
        )}
        <Box display="flex" gap={2}>
          <Button onClick={onClose}>Close</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
