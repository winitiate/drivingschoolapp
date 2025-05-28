// src/pages/Client/BookingPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

import { FirestoreAppointmentStore } from "../../data/FirestoreAppointmentStore";
import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";
import { FirestoreAvailabilityStore } from "../../data/FirestoreAvailabilityStore";

import type { Appointment } from "../../models/Appointment";
import type { Availability, DailySlot } from "../../models/Availability";

export default function BookingPage() {
  const { id: locId } = useParams<{ id: string }>();
  const { user } = useAuth();

  // 1) Must be signed in
  if (!user) return <Navigate to="/sign-in" replace />;
  // 2) Must belong to this location
  if (!locId || !user.clientLocationIds?.includes(locId)) {
    return <Navigate to="/" replace />;
  }

  const db = useMemo(() => getFirestore(), []);
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const availabilityStore = useMemo(() => new FirestoreAvailabilityStore(), []);

  // dropdown state
  const [types, setTypes] = useState<{ id: string; title: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // user picks
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("any");

  // availabilities
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);

  // calendar + slots
  const next30 = useMemo(
    () => Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day")),
    []
  );
  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [slots, setSlots] = useState<DailySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DailySlot | null>(null);

  // <-- which provider actually owns the clicked slot -->
  const [selectedSlotProviderId, setSelectedSlotProviderId] = useState<
    string | null
  >(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // 3) Load types & providers
  useEffect(() => {
    setLoading(true);
    Promise.all([
      providerStore.listByServiceLocation(locId),
      typeStore.listByServiceLocation(locId),
    ])
      .then(async ([provList, typeList]) => {
        const provs = await Promise.all(
          provList.map(async (p) => {
            const snap = await getDoc(doc(db, "users", p.userId));
            const d = snap.exists() ? (snap.data() as any) : {};
            return {
              id: p.id!,
              name: `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
                "Unknown",
            };
          })
        );
        setProviders(provs);
        setTypes(typeList.map((t) => ({ id: t.id!, title: t.title })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [locId]);

  // 3a) Auto‐select if only one type
  useEffect(() => {
    if (types.length === 1) setSelectedType(types[0].id);
  }, [types]);

  // 4) Load availability when provider changes
  useEffect(() => {
    if (!selectedProvider) return;
    setAvailLoading(true);

    const loader =
      selectedProvider === "any"
        ? availabilityStore
            .listAll()
            .then((all) => all.filter((a) => a.scope === "provider"))
        : availabilityStore
            .getByScope("provider", selectedProvider)
            .then((a) => (a ? [a] : []));

    loader
      .then((arr) => setAvailabilities(arr))
      .catch(console.error)
      .finally(() => setAvailLoading(false));
  }, [selectedProvider]);

  // 5) Compute which next 30 days have slots
  useEffect(() => {
    if (availLoading) return;
    const good = next30.filter((d) => {
      if (d.isBefore(dayjs(), "day")) return false;
      const iso = d.format("YYYY-MM-DD");
      if (availabilities.some((a) => a.blocked.includes(iso))) return false;
      return availabilities.some((a) =>
        a.weekly.some((w) => w.weekday === d.day() && w.slots.length > 0)
      );
    });
    setAvailableDates(good);
  }, [availabilities, availLoading]);

  // 6) Reset & auto-pick first date + slots
  useEffect(() => {
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setSelectedSlotProviderId(null);

    if (
      selectedType &&
      selectedProvider &&
      !availLoading &&
      availableDates.length > 0
    ) {
      const first = availableDates[0];
      setSelectedDate(first);
      loadSlots(first);
    }
  }, [selectedType, selectedProvider, availLoading, availableDates]);

  // 7) Gather slots for chosen day
  const loadSlots = useCallback(
    (d: Dayjs | null) => {
      if (!d) {
        setSlots([]);
        return;
      }
      const wd = d.day();
      let all: DailySlot[] = [];
      availabilities.forEach((a) => {
        const sch = a.weekly.find((w) => w.weekday === wd);
        if (sch) all = all.concat(sch.slots);
      });
      const uniq = Array.from(
        new Map(all.map((s) => [`${s.start}-${s.end}`, s])).values()
      ).sort((a, b) => a.start.localeCompare(b.start));
      setSlots(uniq);
    },
    [availabilities]
  );

  // 8a) Date picker
  const onDateChange = (d: Dayjs | null) => {
    setSelectedDate(d);
    loadSlots(d);
  };

  // 8b) Slot click — also detect provider for “Any”
  const onSlotClick = (s: DailySlot) => {
    let providerId: string | null = null;
    if (selectedProvider !== "any") {
      providerId = selectedProvider;
    } else if (selectedDate) {
      // find availability doc whose weekly slots include this exact slot
      const avail = availabilities.find((a) =>
        a.weekly
          .find((w) => w.weekday === selectedDate.day())
          ?.slots.some((sl) => sl.start === s.start && sl.end === s.end)
      );
      providerId = (avail as any)?.scopeId ?? avail?.id ?? null;
    }

    setSelectedSlot(s);
    setSelectedSlotProviderId(providerId);
    setConfirmOpen(true);
  };

  // 8c) Confirm & save — now including date/time strings
  const onConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;

    const dateStr = selectedDate.format("YYYY-MM-DD");
    const timeStr = selectedSlot.start;
    const durationMinutes = dayjs(selectedSlot.end, "HH:mm").diff(
      dayjs(selectedSlot.start, "HH:mm"),
      "minute"
    );

    const payload: Appointment = {
      clientId: user.uid,
      serviceProviderId: selectedSlotProviderId ?? "",
      serviceLocationId: locId,
      appointmentTypeId: selectedType,
      date: dateStr,                 // <-- required now
      time: timeStr,                 // <-- required now
      durationMinutes,
      status: "scheduled",
      notes: "",
    };

    await apptStore.save(payload);
    setConfirmOpen(false);
  };

  // 9) Loading / error
  if (loading)
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  const typeTitle = types.find((t) => t.id === selectedType)?.title || "";
  const provName =
    selectedProvider === "any"
      ? "(Any)"
      : providers.find((p) => p.id === selectedProvider)?.name || "";
  const confirmProvName = selectedSlotProviderId
    ? providers.find((p) => p.id === selectedSlotProviderId)?.name || ""
    : provName;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Book an Appointment
        </Typography>

        {/* Appointment Type */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Appointment Type</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as string)}
            label="Appointment Type"
          >
            <MenuItem value="">
              <em>Select…</em>
            </MenuItem>
            {types.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Service Provider */}
        {selectedType && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Service Provider</InputLabel>
            <Select
              value={selectedProvider}
              onChange={(e) =>
                setSelectedProvider(e.target.value as string)
              }
              label="Service Provider"
            >
              <MenuItem value="any">(Any)</MenuItem>
              {providers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Calendar */}
        {selectedType && selectedProvider && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Select a Date</Typography>
            <DateCalendar
              value={selectedDate}
              onChange={onDateChange}
              disablePast
              shouldDisableDate={(d) =>
                !availableDates.some((x) => x.isSame(d, "day"))
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
          </Box>
        )}

        {/* Time slots */}
        {selectedDate && selectedType && selectedProvider && (
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="subtitle1">
              Available Time Slots
            </Typography>
            {slots.length > 0 ? (
              slots.map((s) => (
                <Button
                  key={`${s.start}-${s.end}`}
                  variant="outlined"
                  onClick={() => onSlotClick(s)}
                >
                  {s.start} — {s.end}
                </Button>
              ))
            ) : (
              <Alert severity="info">
                No time slot available on this day.
              </Alert>
            )}
          </Stack>
        )}

        {/* Confirmation */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Confirm Your Appointment</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1}>
              <Typography>
                <strong>Client:</strong> {user.firstName} {user.lastName}
              </Typography>
              <Typography>
                <strong>Type:</strong> {typeTitle}
              </Typography>
              <Typography>
                <strong>Provider:</strong> {confirmProvName}
              </Typography>
              <Typography>
                <strong>Date & Time:</strong>{" "}
                {selectedDate?.format("YYYY-MM-DD")} @{" "}
                {selectedSlot?.start}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={onConfirm}>
              Book Now
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
