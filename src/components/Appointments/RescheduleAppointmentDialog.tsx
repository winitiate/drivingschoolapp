/**
 * RescheduleAppointmentDialog.tsx
 *
 * Lets the client change appointment-type, instructor, date & time,
 * re-uses the same hooks/widgets as BookingPage.
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Box          /* ← added */
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { v4 as uuidv4 } from "uuid";

import AppointmentTypeSelect from "../../pages/Client/BookingPage/components/AppointmentTypeSelect";
import ProviderSelect        from "../../pages/Client/BookingPage/components/ProviderSelect";
import DateSelector          from "../../pages/Client/BookingPage/components/DateSelector";
import TimeSlots             from "../../pages/Client/BookingPage/components/TimeSlots";

import { useTypesAndProviders } from "../../hooks/useTypesAndProviders";
import { useAppointmentsMap }   from "../../hooks/useAppointmentsMap";
import { useAvailabilities }    from "../../hooks/useAvailabilities";
import { buildSlots }           from "../../utils/bookingUtils";

import { rescheduleAppointment } from "../../services/api/appointments/rescheduleAppointment";

import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";
import { FirestoreAvailabilityStore }    from "../../data/FirestoreAvailabilityStore";
import { FirestoreAppointmentStore }     from "../../data/FirestoreAppointmentStore";

import type { Appointment } from "../../models/Appointment";
import type { DailySlot }   from "../../models/Availability";

interface Props {
  open:    boolean;
  oldAppt: Appointment;
  onClose: () => void;
  onDone:  () => void;
}

export default function RescheduleAppointmentDialog({
  open,
  oldAppt,
  onClose,
  onDone,
}: Props) {
  /* ---------- stores & hooks ------------------------------------------ */
  const typeStore     = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const availStore    = useMemo(() => new FirestoreAvailabilityStore(), []);
  const apptStore     = useMemo(() => new FirestoreAppointmentStore(), []);

  const {
    types,
    providers,
    loading: tpLoading,
    error:   tpError,
  } = useTypesAndProviders(oldAppt.serviceLocationId, providerStore, typeStore);

  /* ---------- selections ---------------------------------------------- */
  const [selectedType, setSelectedType] = useState<string>(oldAppt.appointmentTypeId);
  const [selectedProv, setSelectedProv] = useState<string>(
    oldAppt.serviceProviderIds?.[0] ?? "any"
  );

  const next30 = useMemo(
    () => Array.from({ length:30 }, (_,i)=>dayjs().add(i,"day")),
    []
  );

  const apptsByDate = useAppointmentsMap(
    providers,
    selectedProv,
    apptStore,
    oldAppt.serviceLocationId,
    next30
  );

  const { availabilities } = useAvailabilities(selectedProv, availStore);

  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate,   setSelectedDate]   = useState<Dayjs|null>(null);
  const [slots,          setSlots]          = useState<DailySlot[]>([]);
  const [selectedSlot,   setSelectedSlot]   = useState<DailySlot|null>(null);

  useEffect(() => {
    const good = next30.filter(d =>
      buildSlots(d, availabilities, providers, apptsByDate, selectedProv).length>0
    );
    setAvailableDates(good);
    if (selectedDate && !good.some(g=>g.isSame(selectedDate,"day"))) {
      setSelectedDate(null);
      setSlots([]);
    }
  }, [availabilities, providers, apptsByDate, selectedProv, selectedDate, next30]);

  useEffect(() => {
    setSlots(
      buildSlots(selectedDate, availabilities, providers, apptsByDate, selectedProv)
    );
  }, [selectedDate, availabilities, providers, apptsByDate, selectedProv]);

  /* ---------- confirm -------------------------------------------------- */
  const [saving,setSaving] = useState(false);
  const [error,setError]   = useState<string|null>(null);

  const confirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true); setError(null);

    const newId = uuidv4();
    const iso   = selectedDate.format("YYYY-MM-DD");
    const start = dayjs(`${iso}T${selectedSlot.start}`).toDate();
    const end   = dayjs(`${iso}T${selectedSlot.end}`).toDate();
    const dur   = dayjs(end).diff(start,"minute");

    try {
      await rescheduleAppointment({
        oldAppointmentId: oldAppt.id!,
        newAppointmentData: {
          id: newId,
          clientIds:          oldAppt.clientIds,
          serviceProviderIds: [selectedProv],
          appointmentTypeId:  selectedType,
          serviceLocationId:  oldAppt.serviceLocationId,
          startTime:          start,
          endTime:            end,
          durationMinutes:    dur,
          status:             "scheduled",
          notes:              oldAppt.notes ?? "",
        },
      });
      onDone();
    } catch(e:any) {
      setError(e.message || "Reschedule failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- render --------------------------------------------------- */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reschedule Appointment</DialogTitle>

      <DialogContent dividers>
        {tpError && <Alert severity="error" sx={{mb:1}}>{tpError}</Alert>}
        {error   && <Alert severity="error" sx={{mb:1}}>{error}</Alert>}

        {tpLoading ? (
          <Box sx={{ display:"flex", justifyContent:"center", py:4 }}>
            <CircularProgress/>
          </Box>
        ) : (
          <>
            <AppointmentTypeSelect
              types={types}
              value={selectedType}
              onChange={setSelectedType}
            />

            <ProviderSelect
              providers={providers}
              value={selectedProv}
              onChange={id=>{ setSelectedProv(id); setSelectedSlot(null); }}
            />

            <DateSelector
              availableDates={availableDates}
              firstAvail={availableDates[0] ?? null}
              value={selectedDate}
              onChange={d=>{ setSelectedDate(d); setSelectedSlot(null); }}
            />

            {selectedDate && (
              <TimeSlots
                slots={slots}
                selectedDate={selectedDate}
                onSlotClick={setSelectedSlot}
              />
            )}

            {!selectedDate && (
              <Typography variant="body2" color="text.secondary" sx={{mt:1}}>
                No available dates for this selection in the next&nbsp;30&nbsp;days.
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Back</Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={saving || !selectedSlot}
        >
          {saving ? <CircularProgress size={20}/> : "Reschedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
