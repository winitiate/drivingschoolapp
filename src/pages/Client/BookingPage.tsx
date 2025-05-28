// src/pages/Client/BookingPage.tsx
// ­Capacity-aware booking page that saves modern Appointment fields only.

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

/* ───────────────────────────────────────────────────────────── */

export default function BookingPage() {
  const { id: locId } = useParams<{ id: string }>();
  const { user }      = useAuth();

  /* ───────── guards ───────── */
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!locId || !user.clientLocationIds?.includes(locId))
    return <Navigate to="/" replace />;

  /* ───────── stores ───────── */
  const db                = useMemo(() => getFirestore(), []);
  const apptStore         = useMemo(() => new FirestoreAppointmentStore(), []);
  const typeStore         = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore     = useMemo(() => new FirestoreServiceProviderStore(), []);
  const availabilityStore = useMemo(() => new FirestoreAvailabilityStore(), []);

  /* ───────── dropdown / UI state ───────── */
  const [types, setTypes] = useState<{ id: string; title: string }[]>([]);
  const [providers, setProviders] = useState<
    { id: string; name: string; maxSimultaneousClients: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [selectedType,     setSelectedType]     = useState("");
  const [selectedProvider, setSelectedProvider] = useState("any");

  /* ───────── availability / appts ───────── */
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [availLoading,   setAvailLoading]   = useState(false);

  // Map YYYY-MM-DD → Appointment[]
  const [apptsByDate, setApptsByDate] = useState<Map<string, Appointment[]>>(new Map());
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  /* ───────── calendar ───────── */
  const next30 = useMemo(
    () => Array.from({ length: 30 }, (_, i) => dayjs().add(i, "day")),
    []
  );
  const [availableDates, setAvailableDates] = useState<Dayjs[]>([]);
  const [selectedDate,   setSelectedDate]   = useState<Dayjs | null>(null);
  const [slots,          setSlots]          = useState<DailySlot[]>([]);
  const [selectedSlot,          setSelectedSlot]          = useState<DailySlot | null>(null);
  const [selectedSlotProviderId, setSelectedSlotProviderId] = useState<string | null>(null);
  const [confirmOpen,           setConfirmOpen]            = useState(false);

  /* ───────── 1. load types & providers ───────── */
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
            const u    = snap.exists() ? (snap.data() as any) : {};
            const name =
              `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
            const ent  = await providerStore.getById(p.id!);
            return {
              id: p.id!,
              name,
              maxSimultaneousClients: ent?.maxSimultaneousClients ?? Infinity,
            };
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

  /* ───────── 2. preload 30-day appointments ───────── */
  useEffect(() => {
    if (providers.length === 0) return;

    (async () => {
      let appts: Appointment[] = [];
      if (selectedProvider === "any") {
        const lists = await Promise.all(
          providers.map((p) => apptStore.listByServiceProvider(p.id))
        );
        appts = lists.flat();
      } else {
        appts = await apptStore.listByServiceProvider(selectedProvider);
      }

      const filtered = appts.filter(
        (a) =>
          a.serviceLocationId === locId &&
          a.startTime &&
          next30.some(
            (d) => d.format("YYYY-MM-DD") === dayjs(a.startTime).format("YYYY-MM-DD")
          )
      );

      const map = new Map<string, Appointment[]>();
      filtered.forEach((a) => {
        const iso = dayjs(a.startTime).format("YYYY-MM-DD");
        const list = map.get(iso) ?? [];
        list.push(a);
        map.set(iso, list);
      });
      setApptsByDate(map);
    })();
  }, [providers, selectedProvider, apptStore, locId, next30]);

  /* ───────── helpers ───────── */
  const overlaps = (a: Appointment, s: DailySlot, iso: string) => {
    const aStart = dayjs(a.startTime);
    const aEnd   = dayjs(a.endTime);
    const sStart = dayjs(`${iso}T${s.start}`);
    const sEnd   = dayjs(`${iso}T${s.end}`);
    return aStart.isBefore(sEnd) && aEnd.isAfter(sStart);
  };

  const providerHasRoom = (
    pid: string,
    slot: DailySlot,
    iso: string,
    cap: number
  ) => {
    const appts = apptsByDate.get(iso) ?? [];
    const used  = appts.filter(
      (a) => a.serviceProviderIds?.includes(pid) && overlaps(a, slot, iso)
    ).length;
    return used < cap;
  };

  /* ───────── 3. load availabilities ───────── */
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

  /* ───────── 4. compute availableDates ───────── */
  useEffect(() => {
    if (availLoading) return;

    const good = next30.filter((d) => {
      if (d.isBefore(dayjs(), "day")) return false;
      const iso = d.format("YYYY-MM-DD");

      const combos: { slot: DailySlot; providerId: string; cap: number }[] = [];
      availabilities.forEach((a) => {
        const sch = a.weekly.find((w) => w.weekday === d.day());
        if (!sch) return;
        const cap =
          a.maxConcurrent ??
          providers.find((p) => p.id === a.scopeId)?.maxSimultaneousClients ??
          Infinity;
        sch.slots.forEach((s) =>
          combos.push({ slot: s, providerId: a.scopeId, cap })
        );
      });
      if (combos.length === 0) return false;

      if (selectedProvider !== "any") {
        const rel = combos.filter((x) => x.providerId === selectedProvider);
        return rel.some(({ slot, cap }) =>
          providerHasRoom(selectedProvider, slot, iso, cap)
        );
      }
      return combos.some(({ providerId, slot, cap }) =>
        providerHasRoom(providerId, slot, iso, cap)
      );
    });

    setAvailableDates(good);
    if (selectedDate && !good.some((x) => x.isSame(selectedDate, "day"))) {
      setSelectedDate(null);
      setSlots([]);
    }
  }, [
    availabilities,
    providers,
    availLoading,
    next30,
    apptsByDate,
    selectedProvider,
    selectedDate,
  ]);

  /* ───────── 5. auto-select first available date ───────── */
  const firstAvail = availableDates[0] ?? null;

  useEffect(() => {
    if (!selectedDate && firstAvail) {
      setSelectedDate(firstAvail);
      buildSlots(firstAvail);
    }
  }, [firstAvail, selectedDate]); // buildSlots is memo-stable

  /* ───────── 6. existingAppointments for chosen day ───────── */
  useEffect(() => {
    if (!selectedDate) {
      setExistingAppointments([]);
      return;
    }
    const iso = selectedDate.format("YYYY-MM-DD");
    setExistingAppointments(apptsByDate.get(iso) ?? []);
  }, [selectedDate, apptsByDate]);

  /* ───────── 7. build slots list ───────── */
  const buildSlots = useCallback(
    (d: Dayjs | null) => {
      if (!d) {
        setSlots([]);
        return;
      }
      const iso = d.format("YYYY-MM-DD");
      const wd  = d.day();

      type Combo = { slot: DailySlot; providerId: string; cap: number };
      const combos: Combo[] = [];
      availabilities.forEach((a) => {
        const sch = a.weekly.find((w) => w.weekday === wd);
        if (!sch) return;
        const cap =
          a.maxConcurrent ??
          providers.find((p) => p.id === a.scopeId)?.maxSimultaneousClients ??
          Infinity;
        sch.slots.forEach((s) =>
          combos.push({ slot: s, providerId: a.scopeId, cap })
        );
      });

      const uniq = Array.from(
        new Map(
          combos.map((c) => [`${c.slot.start}-${c.slot.end}`, c.slot])
        ).values()
      ).sort((a, b) => a.start.localeCompare(b.start));

      const filtered = uniq.filter((slot) => {
        if (selectedProvider !== "any") {
          const cap =
            availabilities.find((a) => a.scopeId === selectedProvider)?.maxConcurrent ??
            providers.find((p) => p.id === selectedProvider)?.maxSimultaneousClients ??
            Infinity;
          return providerHasRoom(selectedProvider, slot, iso, cap);
        }
        return providers.some((p) => {
          const offers = combos.some(
            (c) => c.providerId === p.id && c.slot.start === slot.start
          );
          if (!offers) return false;
          const cap =
            availabilities.find((a) => a.scopeId === p.id)?.maxConcurrent ??
            p.maxSimultaneousClients;
          return providerHasRoom(p.id, slot, iso, cap);
        });
      });

      setSlots(filtered);
    },
    [availabilities, providers, apptsByDate, selectedProvider]
  );

  useEffect(() => {
    buildSlots(selectedDate);
  }, [selectedDate, existingAppointments, buildSlots]);

  /* ───────── 8. handlers ───────── */
  const onDateChange = (d: Dayjs | null) => {
    setSelectedDate(d);
    buildSlots(d);
  };

  const pickProviderForAny = (s: DailySlot): string | null => {
    if (!selectedDate) return null;
    const wd = selectedDate.day();
    for (const a of availabilities) {
      const sch = a.weekly.find((w) => w.weekday === wd);
      if (!sch) continue;
      if (sch.slots.some((sl) => sl.start === s.start && sl.end === s.end))
        return a.scopeId;
    }
    return null;
  };

  const onSlotClick = (s: DailySlot) => {
    const pid =
      selectedProvider !== "any" ? selectedProvider : pickProviderForAny(s);
    setSelectedSlot(s);
    setSelectedSlotProviderId(pid);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
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

    setApptsByDate((prev) => {
      const isoKey = startDT.format("YYYY-MM-DD");
      const list   = prev.get(isoKey) ?? [];
      return new Map(prev).set(isoKey, [...list, payload]);
    });

    setConfirmOpen(false);
  };

  /* ───────── 9. render ───────── */
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
              value={selectedDate ?? firstAvail}
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
                        ...(ok && { border: "2px solid green", borderRadius: "50%" }),
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
              slots.map((s) => {
                const dateLabel  = selectedDate.format("dddd, MMMM D, YYYY");
                const startLabel = dayjs(s.start, "HH:mm").format("h:mmA");
                const endLabel   = dayjs(s.end,   "HH:mm").format("h:mmA");
                return (
                  <Button
                    key={`${s.start}-${s.end}`}
                    variant="outlined"
                    onClick={() => onSlotClick(s)}
                  >
                    {`${dateLabel} ${startLabel} to ${endLabel}`}
                  </Button>
                );
              })
            ) : (
              <Alert severity="info">No time slot available on this day.</Alert>
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
                {selectedDate?.format("dddd, MMMM D, YYYY")}{" "}
                {dayjs(selectedSlot?.start, "HH:mm").format("h:mmA")}
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
