import dayjs, { Dayjs } from "dayjs";
import type { Appointment } from "../models/Appointment";
import type { Availability, DailySlot } from "../models/Availability";

/* —————————————————————————————————————————— *
 *  Pure helpers — NO React imports here
 * —————————————————————————————————————————— */

/** Does an appointment overlap a slot on a given ISO date? */
export function overlaps(
  a: Appointment,
  slot: DailySlot,
  iso: string
): boolean {
  const aStart = dayjs(a.startTime);
  const aEnd   = dayjs(a.endTime);
  const sStart = dayjs(`${iso}T${slot.start}`);
  const sEnd   = dayjs(`${iso}T${slot.end}`);
  return aStart.isBefore(sEnd) && aEnd.isAfter(sStart);
}

/** Returns true if the provider still has capacity in that slot. */
export function providerHasRoom(
  pid: string,
  slot: DailySlot,
  iso: string,
  cap: number,
  apptsOfDay: Appointment[]
): boolean {
  const used = apptsOfDay.filter(
    (a) => a.serviceProviderIds?.includes(pid) && overlaps(a, slot, iso)
  ).length;
  return used < cap;
}

/**
 * Build the unique, capacity-filtered slot list for a given day.
 * Pure; no setState side-effects inside.
 */
export function buildSlots(
  date: Dayjs | null,
  availabilities: Availability[],
  providers: { id: string; maxSimultaneousClients: number }[],
  apptsByDate: Map<string, Appointment[]>,
  selectedProvider: string
): DailySlot[] {
  if (!date) return [];

  const iso = date.format("YYYY-MM-DD");
  const weekday = date.day();

  type Combo = { slot: DailySlot; providerId: string; cap: number };
  const combos: Combo[] = [];

  /* Flatten all provider-scoped availabilities into slot/provider pairs */
  availabilities.forEach((a) => {
    const sch = a.weekly.find((w) => w.weekday === weekday);
    if (!sch) return;
    const cap =
      a.maxConcurrent ??
      providers.find((p) => p.id === a.scopeId)?.maxSimultaneousClients ??
      Infinity;

    sch.slots.forEach((s) =>
      combos.push({ slot: s, providerId: a.scopeId, cap })
    );
  });

  /* Unique slots for that weekday */
  const uniq: DailySlot[] = Array.from(
    new Map(combos.map((c) => [`${c.slot.start}-${c.slot.end}`, c.slot])).values()
  ).sort((a, b) => a.start.localeCompare(b.start));

  if (uniq.length === 0) return [];

  const apptsOfDay = apptsByDate.get(iso) ?? [];

  /* Capacity filter */
  return uniq.filter((slot) => {
    if (selectedProvider !== "any") {
      const cap =
        availabilities.find((a) => a.scopeId === selectedProvider)?.maxConcurrent ??
        providers.find((p) => p.id === selectedProvider)?.maxSimultaneousClients ??
        Infinity;
      return providerHasRoom(
        selectedProvider,
        slot,
        iso,
        cap,
        apptsOfDay
      );
    }

    /* “any” -> keep slot if at least one provider can host it */
    return providers.some((p) => {
      const offers = combos.some(
        (c) => c.providerId === p.id && c.slot.start === slot.start
      );
      if (!offers) return false;

      const cap =
        availabilities.find((a) => a.scopeId === p.id)?.maxConcurrent ??
        p.maxSimultaneousClients;

      return providerHasRoom(p.id, slot, iso, cap, apptsOfDay);
    });
  });
}
