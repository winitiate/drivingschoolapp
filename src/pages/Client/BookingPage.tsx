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

  /* ---------- 1  auth / location guard ---------- */
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!locId || !user.clientLocationIds?.includes(locId)) {
    return <Navigate to="/" replace />;
  }

  const db                 = useMemo(() => getFirestore(), []);
  const apptStore          = useMemo(() => new FirestoreAppointmentStore(), []);
  const typeStore          = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore      = useMemo(() => new FirestoreServiceProviderStore(), []);
  const availabilityStore  = useMemo(() => new FirestoreAvailabilityStore(), []);

  /* ---------- dropdown data ---------- */
  const [types, setTypes] = useState<{ id: string; title: string }[]>([]);
  const [providers, setProviders] = useState<
    { id: string; name: string; maxSimultaneousClients: number }[]
  >([]);

  /* ---------- ui state ---------- */
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [selectedType, setSelectedType]         = useState("");
  const [selectedProvider, setSelectedProvider] = useState("any");

  /* ---------- data ---------- */
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [availLoading, setAvailLoading]     = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  /* ---------- calendar ---------- */
  const next30 = useMemo(
    () => Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day")),
    []
  );
  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate, setSelectedDate]     = useState<Dayjs | null>(null);
  const [slots, setSlots]                   = useState<DailySlot[]>([]);
  const [selectedSlot, setSelectedSlot]     = useState<DailySlot | null>(null);
  const [selectedSlotProviderId, setSelectedSlotProviderId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen]       = useState(false);

  /* ---------- 2  load types & providers ---------- */
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
            const u = snap.exists() ? (snap.data() as any) : {};
            const name =
              `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
            const ent  = await providerStore.getById(p.id!);
            const cap  = ent?.maxSimultaneousClients ?? Infinity;
            return { id: p.id!, name, maxSimultaneousClients: cap };
          })
        );
        setProviders(provs);
        setTypes(typeList.map((t) => ({ id: t.id!, title: t.title })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [locId, db, providerStore, typeStore]);

  useEffect(() => {
    if (types.length === 1) setSelectedType(types[0].id);
  }, [types]);

  /* ---------- 3  load appointments for selected day ---------- */
  useEffect(() => {
    if (!selectedDate || providers.length === 0) {
      setExistingAppointments([]);
      return;
    }
    (async () => {
      const iso = selectedDate.format("YYYY-MM-DD");
      let appts: Appointment[] = [];
      if (selectedProvider === "any") {
        const lists = await Promise.all(
          providers.map((p) => apptStore.listByServiceProvider(p.id))
        );
        appts = lists.flat();
      } else {
        appts = await apptStore.listByServiceProvider(selectedProvider);
      }
      setExistingAppointments(
        appts.filter(
          (a) => a.serviceLocationId === locId && a.date === iso && a.time != null
        )
      );
    })();
  }, [selectedProvider, providers, selectedDate, locId, apptStore]);

  /* ---------- 4  load availabilities ---------- */
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
      .then(setAvailabilities)
      .catch(console.error)
      .finally(() => setAvailLoading(false));
  }, [selectedProvider, availabilityStore]);

  /* ---------- 5  compute dates with availability ---------- */
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
  }, [availabilities, availLoading, next30]);

  /* ---------- 6  reset when picker changes ---------- */
  useEffect(() => {
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setSelectedSlotProviderId(null);
    if (
      selectedType &&
      selectedProvider &&
      !availLoading &&
      availableDates.length
    ) {
      const first = availableDates[0];
      setSelectedDate(first);
      loadSlots(first);
    }
  }, [selectedType, selectedProvider, availLoading, availableDates]);

  /* ---------- 7  build & filter slots ---------- */
  const loadSlots = useCallback(
    (d: Dayjs | null) => {
      if (!d) {
        setSlots([]);
        return;
      }
      const iso = d.format("YYYY-MM-DD");
      const wd  = d.day();

      type ProvSlot = { slot: DailySlot; providerId: string };
      const provSlots: ProvSlot[] = [];
      availabilities.forEach((a) => {
        const sch = a.weekly.find((w) => w.weekday === wd);
        if (!sch) return;
        sch.slots.forEach((s) =>
          provSlots.push({ slot: s, providerId: a.scopeId })
        );
      });

      const uniq = Array.from(
        new Map(
          provSlots.map((ps) => [`${ps.slot.start}-${ps.slot.end}`, ps.slot])
        ).values()
      ).sort((a, b) => a.start.localeCompare(b.start));

      const overlaps = (a: Appointment, s: DailySlot) => {
        const aStart = dayjs(`${iso}T${a.time}`);
        const len    = a.durationMinutes ?? 90;          // <-- fallback
        const aEnd   = aStart.add(len, "minute");
        const sStart = dayjs(`${iso}T${s.start}`);
        const sEnd   = dayjs(`${iso}T${s.end}`);
        return aStart.isBefore(sEnd) && aEnd.isAfter(sStart);
      };

      const filtered = uniq.filter((slot) => {
        if (selectedProvider !== "any") {
          const prov  = providers.find((p) => p.id === selectedProvider)!;
          const avail = availabilities.find((a) => a.scopeId === prov.id);
          const cap   = avail?.maxConcurrent ?? prov.maxSimultaneousClients;
          const used  = existingAppointments.filter(
            (a) => a.serviceProviderId === prov.id && overlaps(a, slot)
          ).length;
          return used < cap;
        }
        // “Any” provider
        return providers.some((p) => {
          const offers = provSlots.some(
            (ps) => ps.providerId === p.id && ps.slot.start === slot.start
          );
          if (!offers) return false;
          const avail = availabilities.find((a) => a.scopeId === p.id);
          const cap   = avail?.maxConcurrent ?? p.maxSimultaneousClients;
          const used  = existingAppointments.filter(
            (a) => a.serviceProviderId === p.id && overlaps(a, slot)
          ).length;
          return used < cap;
        });
      });

      setSlots(filtered);
    },
    [availabilities, providers, existingAppointments, selectedProvider]
  );

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, existingAppointments, loadSlots]);

  /* ---------- 8  handlers ---------- */
  const onDateChange = (d: Dayjs | null) => {
    setSelectedDate(d);
    loadSlots(d);
  };

  const onSlotClick = (s: DailySlot) => {
    const pickProviderForAny = (): string | null => {
      if (!selectedDate) return null;
      const wd = selectedDate.day();
      for (const a of availabilities) {
        const sch = a.weekly.find((w) => w.weekday === wd);
        if (!sch) continue;
        if (sch.slots.some((sl) => sl.start === s.start && sl.end === s.end)) {
          return a.scopeId;
        }
      }
      return null;
    };

    const pid =
      selectedProvider !== "any" ? selectedProvider : pickProviderForAny();

    setSelectedSlot(s);
    setSelectedSlotProviderId(pid);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    const dateStr  = selectedDate.format("YYYY-MM-DD");
    const duration = dayjs(selectedSlot.end, "HH:mm").diff(
      dayjs(selectedSlot.start, "HH:mm"),
      "minute"
    );
    const payload: Appointment = {
      clientId:          user.uid,
      serviceProviderId: selectedSlotProviderId ?? "",
      serviceLocationId: locId,
      appointmentTypeId: selectedType,
      date:              dateStr,
      time:              selectedSlot.start,
      durationMinutes:   duration,
      status:            "scheduled",
      notes:             "",
    };
    await apptStore.save(payload);
    setSelectedDate(dayjs(dateStr));     // refresh list
    setConfirmOpen(false);
  };

  /* ---------- 9  render ---------- */
  if (loading)
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  const typeTitle = types.find((t) => t.id === selectedType)?.title || "";
  const provName  =
    selectedProvider === "any"
      ? "(Any)"
      : providers.find((p) => p.id === selectedProvider)?.name || "";
  const confirmProvName =
    selectedSlotProviderId
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
              onChange={(e) => setSelectedProvider(e.target.value as string)}
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
                  const ok = availableDates.some((d) => d.isSame(props.day, "day"));
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
            <Typography variant="subtitle1">Available Time Slots</Typography>
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
                {selectedDate?.format("YYYY-MM-DD")} @ {selectedSlot?.start}
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
