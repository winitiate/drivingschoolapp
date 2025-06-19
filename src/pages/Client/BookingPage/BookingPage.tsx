// src/pages/Client/BookingPage/BookingPage.tsx

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  useParams,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
} from "@mui/material";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { v4 as uuidv4 } from "uuid";

import { FirestoreAppointmentStore }     from "../../../data/FirestoreAppointmentStore";
import { FirestoreAppointmentTypeStore } from "../../../data/FirestoreAppointmentTypeStore";
import { FirestoreServiceProviderStore } from "../../../data/FirestoreServiceProviderStore";
import { FirestoreAvailabilityStore }    from "../../../data/FirestoreAvailabilityStore";

import type { Appointment } from "../../../models/Appointment";
import type { DailySlot }   from "../../../models/Availability";

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

// ← Your single‐call backend that both charges and writes the appointment
import { bookAppointment } from "../../../services/bookAppointment";

export default function BookingPage() {
  const { id: locId } = useParams<{ id: string }>();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  // 0) Access control
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!locId || !user.clientLocationIds?.includes(locId))
    return <Navigate to="/" replace />;

  /* ─── Stores ───────────────────────────────────────────────────────── */
  const apptStore         = useMemo(() => new FirestoreAppointmentStore(), []);
  const typeStore         = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore     = useMemo(() => new FirestoreServiceProviderStore(), []);
  const availabilityStore = useMemo(() => new FirestoreAvailabilityStore(), []);

  /* ─── Square credentials (public) ─────────────────────────────────── */
  const [squareAppId, setSquareAppId] = useState<string>("");
  const [squareLocId, setSquareLocId] = useState<string>("");

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

  /* ─── Dropdown state ──────────────────────────────────────────────── */
  const [selectedType,     setSelectedType]     = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("any");

  /* ─── Prepare next-30-days array ──────────────────────────────────── */
  const next30 = useMemo(
    () => Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day")),
    []
  );

  /* ─── Load types + providers ─────────────────────────────────────── */
  const {
    types,
    providers,
    loading: tpLoading,
    error:   tpError,
  } = useTypesAndProviders(locId, providerStore, typeStore);

  useEffect(() => {
    if (types.length === 1) setSelectedType(types[0].id);
  }, [types]);

  /* ─── Build appointments map ─────────────────────────────────────── */
  const apptsByDate = useAppointmentsMap(
    providers,
    selectedProvider,
    apptStore,
    locId,
    next30
  );

  /* ─── Load availabilities ───────────────────────────────────────── */
  const {
    availabilities,
    loading: availLoading,
  } = useAvailabilities(selectedProvider, availabilityStore);

  /* ─── Calendar state ────────────────────────────────────────────── */
  const [availableDates, setAvailableDates]           = useState<Dayjs[]>([]);
  const [selectedDate,   setSelectedDate]             = useState<Dayjs | null>(null);
  const [slots,          setSlots]                    = useState<DailySlot[]>([]);
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

  useEffect(() => {
    setSlots(
      buildSlots(selectedDate, availabilities, providers, apptsByDate, selectedProvider)
    );
  }, [selectedDate, availabilities, providers, apptsByDate, selectedProvider]);

  useEffect(() => {
    if (!selectedDate) {
      setExistingAppointments([]);
      return;
    }
    const iso = selectedDate.format("YYYY-MM-DD");
    setExistingAppointments(apptsByDate.get(iso) ?? []);
  }, [selectedDate, apptsByDate]);

  /* ─── Slot selection & dialogs ──────────────────────────────────── */
  const [selectedSlot,           setSelectedSlot]           = useState<DailySlot | null>(null);
  const [selectedSlotProviderId, setSelectedSlotProviderId] = useState<string | null>(null);
  const [confirmOpen,            setConfirmOpen]            = useState<boolean>(false);

  // Payment dialog state
  const [payOpen,     setPayOpen]     = useState<boolean>(false);
  const [amountCents, setAmountCents] = useState<number>(0);

  // **New:** track the ID we’ll use when we actually write on the server
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string>("");

  // Errors from tp-loading or booking
  const [bookingError, setBookingError] = useState<string | null>(null);

  const pickProviderForAny = (slot: DailySlot): string | null => {
    if (!selectedDate) return null;
    const weekday = selectedDate.day();
    for (const a of availabilities) {
      const sch = a.weekly.find((w) => w.weekday === weekday);
      if (!sch) continue;
      if (sch.slots.some((sl) => sl.start === slot.start && sl.end === slot.end)) {
        return a.scopeId;
      }
    }
    return null;
  };

  const onSlotClick = (slot: DailySlot) => {
    const pid = selectedProvider !== "any"
      ? selectedProvider
      : pickProviderForAny(slot);
    setSelectedSlot(slot);
    setSelectedSlotProviderId(pid);
    setConfirmOpen(true);
  };

  /* ─── “Confirm” click: decide if we need payment ──────────────── */
  const onConfirm = useCallback(async () => {
    if (!selectedDate || !selectedSlot || !selectedSlotProviderId) return;

    // Lookup the price for this appointment type
    const typeMeta: any = await typeStore.getById(selectedType);
    const cents: number = typeMeta?.priceCents || 0;

    if (cents > 0) {
      // 1) generate & stash our ID
      const tempId = uuidv4();
      setPendingAppointmentId(tempId);

      // 2) stash amount & show card form
      setAmountCents(cents);
      setConfirmOpen(false);
      setPayOpen(true);
      return;
    }

    // No payment needed → straight to booking
    try {
      // generate a permanent ID even for free bookings
      const appointmentId = uuidv4();
      const iso  = selectedDate.format("YYYY-MM-DD");
      const startDT = dayjs(`${iso}T${selectedSlot.start}`).toDate();
      const endDT   = dayjs(`${iso}T${selectedSlot.end}`).toDate();
      const duration = dayjs(endDT).diff(startDT, "minute");

      await bookAppointment({
        toBeUsedBy:      locId,
        amountCents:     0,
        nonce:           "",
        appointmentData: {
          appointmentId,
          clientIds:          [user.uid],
          serviceProviderIds: [selectedSlotProviderId],
          appointmentTypeId:  selectedType,
          serviceLocationId:  locId,
          startTime:          startDT,
          endTime:            endDT,
          durationMinutes:    duration,
          status:             "scheduled",
          notes:              "",
        },
      });

      navigate(`/client/${locId}`);
    } catch (err: any) {
      console.error(err);
      setBookingError(err.message || "Booking failed");
    }
  }, [
    selectedDate,
    selectedSlot,
    selectedSlotProviderId,
    selectedType,
    typeStore,
    locId,
    user.uid,
    navigate,
  ]);

  /* ─── “Pay” form returns a nonce → finish bookAppointment() ───────── */
  const handleTokenize = async (nonce: string) => {
    setPayOpen(false);

    // reuse the ID we generated in onConfirm()
    const appointmentId = pendingAppointmentId;
    if (!appointmentId) {
      console.error("No appointmentId set!");
      return;
    }

    const iso  = selectedDate!.format("YYYY-MM-DD");
    const startDT = dayjs(`${iso}T${selectedSlot!.start}`).toDate();
    const endDT   = dayjs(`${iso}T${selectedSlot!.end}`).toDate();
    const duration = dayjs(endDT).diff(startDT, "minute");

    try {
      await bookAppointment({
        toBeUsedBy:      locId,
        amountCents,     // the same cents you stashed
        nonce,
        appointmentData: {
          appointmentId,
          clientIds:          [user.uid],
          serviceProviderIds: [selectedSlotProviderId!],
          appointmentTypeId:  selectedType,
          serviceLocationId:  locId,
          startTime:          startDT,
          endTime:            endDT,
          durationMinutes:    duration,
          status:             "scheduled",
          notes:              "",
        },
      });

      navigate(`/client/${locId}`);
    } catch (err: any) {
      console.error(err);
      setBookingError(err.message || "Booking & payment failed");
    }
  };

  /* ─── Render ──────────────────────────────────────────────────── */
  if (tpLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (tpError) {
    return <Alert severity="error">{tpError}</Alert>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Book an Appointment
        </Typography>

        {bookingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bookingError}
          </Alert>
        )}

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
            firstAvail={availableDates[0] ?? null}
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

        <ConfirmAppointmentDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirm}
          clientName={`${user.firstName} ${user.lastName}`}
          typeTitle={
            types.find((t) => t.id === selectedType)?.title || ""
          }
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

        <Dialog
          open={payOpen}
          onClose={() => setPayOpen(false)}
          maxWidth="sm"
          fullWidth
          keepMounted={false}
        >
          <Box sx={{ p: 3 }}>
            {squareAppId ? (
              <SquarePayForm
                applicationId={squareAppId}
                locationId={squareLocId}
                onTokenize={handleTokenize}
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
