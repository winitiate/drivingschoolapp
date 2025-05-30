// ­Capacity-aware booking page with embedded Square payment when priceCents > 0

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

import { FirestoreAppointmentStore } from "../../../data/FirestoreAppointmentStore";
import { FirestoreAppointmentTypeStore } from "../../../data/FirestoreAppointmentTypeStore";
import { FirestoreServiceProviderStore } from "../../../data/FirestoreServiceProviderStore";
import { FirestoreAvailabilityStore } from "../../../data/FirestoreAvailabilityStore";

import type { Appointment } from "../../../models/Appointment";
import type { DailySlot } from "../../../models/Availability";

import AppointmentTypeSelect    from "./components/AppointmentTypeSelect";
import ProviderSelect           from "./components/ProviderSelect";
import DateSelector             from "./components/DateSelector";
import TimeSlots                from "./components/TimeSlots";
import ConfirmAppointmentDialog from "./components/ConfirmAppointmentDialog";
import SquarePayForm            from "./components/SquarePayForm";

import { useTypesAndProviders } from "../../../hooks/useTypesAndProviders";
import { useAppointmentsMap }   from "../../../hooks/useAppointmentsMap";
import { useAvailabilities }    from "../../../hooks/useAvailabilities";
import { buildSlots }           from "../../../utils/bookingUtils";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

/* ───────────────────────────────────────────────────────────── */

export default function BookingPage() {
  const { id: locId } = useParams<{ id: string }>();
  const { user }      = useAuth();

  if (!user) return <Navigate to="/sign-in" replace />;
  if (!locId || !user.clientLocationIds?.includes(locId))
    return <Navigate to="/" replace />;

  /* ───────── stores ───────── */
  const apptStore       = useMemo(() => new FirestoreAppointmentStore(), []);
  const typeStore       = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore   = useMemo(() => new FirestoreServiceProviderStore(), []);
  const availabilityStore = useMemo(() => new FirestoreAvailabilityStore(), []);

  /* ───────── Square credentials ───────── */
  const [squareAppId, setSquareAppId] = useState("");
  const [squareLocId, setSquareLocId] = useState("");

  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "paymentCredentials"),
        where("provider", "==", "square"),
        where("ownerType", "==", "serviceLocation"),
        where("ownerId", "==", locId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data() as any;
        setSquareAppId(data.credentials.applicationId);
        setSquareLocId(data.credentials.locationId ?? "");
      }
    })();
  }, [locId]);

  /* ───────── dropdown state ───────── */
  const [selectedType,     setSelectedType]     = useState("");
  const [selectedProvider, setSelectedProvider] = useState("any");

  /* next-30-days */
  const next30 = useMemo(
    () => Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day")),
    []
  );

  /* load types + providers */
  const { types, providers, loading: tpLoading, error } = useTypesAndProviders(
    locId,
    providerStore,
    typeStore
  );

  useEffect(() => {
    if (types.length === 1) setSelectedType(types[0].id);
  }, [types]);

  /* appointments map */
  const apptsByDate = useAppointmentsMap(
    providers,
    selectedProvider,
    apptStore,
    locId,
    next30
  );

  /* availabilities */
  const { availabilities, loading: availLoading } = useAvailabilities(
    selectedProvider,
    availabilityStore
  );

  /* calendar state */
  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate,   setSelectedDate]   = useState<Dayjs | null>(null);
  const [slots,          setSlots]          = useState<DailySlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (availLoading) return;

    const good = next30.filter((d) => {
      if (d.isBefore(dayjs(), "day")) return false;
      return buildSlots(d, availabilities, providers, apptsByDate, selectedProvider).length > 0;
    });

    setAvailableDates(good);

    if (selectedDate && !good.some((x) => x.isSame(selectedDate, "day"))) {
      setSelectedDate(null);
      setSlots([]);
    }
  }, [availLoading, availabilities, providers, apptsByDate, selectedProvider, selectedDate, next30]);

  const firstAvail = availableDates[0] ?? null;

  useEffect(() => {
    setSlots(buildSlots(selectedDate, availabilities, providers, apptsByDate, selectedProvider));
  }, [selectedDate, availabilities, providers, apptsByDate, selectedProvider]);

  useEffect(() => {
    if (!selectedDate) { setExistingAppointments([]); return; }
    const iso = selectedDate.format("YYYY-MM-DD");
    setExistingAppointments(apptsByDate.get(iso) ?? []);
  }, [selectedDate, apptsByDate]);

  /* ───────── slot / dialogs ───────── */
  const [selectedSlot,           setSelectedSlot]           = useState<DailySlot | null>(null);
  const [selectedSlotProviderId, setSelectedSlotProviderId] = useState<string | null>(null);
  const [confirmOpen,            setConfirmOpen]            = useState(false);

  const [payOpen, setPayOpen]     = useState(false);
  const [amountCents, setAmountCents] = useState(0);

  const pickProviderForAny = (slot: DailySlot): string | null => {
    if (!selectedDate) return null;
    const weekday = selectedDate.day();
    for (const a of availabilities) {
      const sch = a.weekly.find((w) => w.weekday === weekday);
      if (!sch) continue;
      if (sch.slots.some((sl) => sl.start === slot.start && sl.end === slot.end))
        return a.scopeId;
    }
    return null;
  };

  const onSlotClick = (slot: DailySlot) => {
    const pid = selectedProvider !== "any" ? selectedProvider : pickProviderForAny(slot);
    setSelectedSlot(slot);
    setSelectedSlotProviderId(pid);
    setConfirmOpen(true);
  };

  /* save appointment helper */
  const saveAppointment = async () => {
    if (!selectedDate || !selectedSlot) return;
    const iso      = selectedDate.format("YYYY-MM-DD");
    const startDT  = dayjs(`${iso}T${selectedSlot.start}`);
    const endDT    = dayjs(`${iso}T${selectedSlot.end}`);
    const duration = endDT.diff(startDT, "minute");

    const payload: Appointment = {
      appointmentTypeId:  selectedType,
      clientIds:          [user.uid],
      serviceProviderIds: [selectedSlotProviderId ?? ""],
      serviceLocationId:  locId,
      startTime:          startDT.toDate(),
      endTime:            endDT.toDate(),
      durationMinutes:    duration,
      status:             "scheduled",
      notes:              "",
    };
    await apptStore.save(payload);
  };

  /* confirm dialog handler */
  const onConfirm = useCallback(async () => {
    if (!selectedDate || !selectedSlot) return;

    const typeMeta: any = await typeStore.getById(selectedType);
    const cents: number = typeMeta?.priceCents ?? 0;

    if (cents > 0) {
      setAmountCents(cents);
      setConfirmOpen(false);
      setPayOpen(true);
      return;
    }

    await saveAppointment();
    setConfirmOpen(false);
  }, [selectedDate, selectedSlot, selectedType, typeStore]);

  /* payment success */
  const handlePaid = async () => {
    await saveAppointment();
    setPayOpen(false);
  };

  /* ───────── render ───────── */
  if (tpLoading)
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Book an Appointment
        </Typography>

        <AppointmentTypeSelect
          types={types}
          value={selectedType}
          onChange={setSelectedType}
        />

        {selectedType && (
          <ProviderSelect
            providers={providers}
            value={selectedProvider}
            onChange={setSelectedProvider}
          />
        )}

        {selectedType && selectedProvider && (
          <DateSelector
            availableDates={availableDates}
            firstAvail={firstAvail}
            value={selectedDate}
            onChange={setSelectedDate}
          />
        )}

        {selectedDate && selectedType && selectedProvider && (
          <TimeSlots
            slots={slots}
            selectedDate={selectedDate}
            onSlotClick={onSlotClick}
          />
        )}

        {/* Summary */}
        <ConfirmAppointmentDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirm}
          clientName={`${user.firstName} ${user.lastName}`}
          typeTitle={types.find((t) => t.id === selectedType)?.title || ""}
          providerName={
            selectedSlotProviderId
              ? providers.find((p) => p.id === selectedSlotProviderId)?.name || ""
              : selectedProvider === "any"
              ? "(Any)"
              : providers.find((p) => p.id === selectedProvider)?.name || ""
          }
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          amountCents={amountCents}
        />

        {/* Square payment */}
        <Dialog
          open={payOpen}
          onClose={() => setPayOpen(false)}
          maxWidth="sm"
          fullWidth
          keepMounted={false}   // unmounts dialog each close to avoid duplicate card iframes
        >
          <Box sx={{ p: 3 }}>
            {squareAppId ? (
              <SquarePayForm
                applicationId={squareAppId}
                locationId={squareLocId}
                amountCents={amountCents}
                appointmentTypeId={selectedType}
                serviceLocationId={locId}
                onSuccess={handlePaid}
                onCancel={() => setPayOpen(false)}
              />
            ) : (
              <Alert severity="error">
                Square credentials not found for this location.
              </Alert>
            )}
          </Box>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
