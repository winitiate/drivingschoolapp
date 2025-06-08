// src/utils/bookingUtils.ts

import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { ProviderAvailability, DailySlot } from "../models/Availability";
import type { Appointment } from "../models/Appointment";

/**
 * Builds the list of available slots for a given service location + provider(s),
 * taking into account existing appointments.
 *
 * @param selectedDate     – the date (Dayjs) to build slots for
 * @param availabilities   – array of ProviderAvailability records
 * @param providers        – array of { id: string } for each provider
 * @param apptsByDate      – Map from “YYYY-MM-DD” → Appointment[]
 * @param selectedProvider – the providerId or “any”
 */
export function buildSlots(
  selectedDate: Dayjs | Date | null,
  availabilities: ProviderAvailability[] | undefined | null,
  providers: { id: string }[],
  apptsByDate: Map<string, Appointment[]>,
  selectedProvider: string
): DailySlot[] {
  // ───── GUARD ─────
  // If availabilities isn’t an array, treat it as empty.
  const avails: ProviderAvailability[] = Array.isArray(availabilities)
    ? availabilities
    : [];

  if (!selectedDate) return [];

  // We’ll return this list:
  const slots: DailySlot[] = [];

  // Build a YYYY-MM-DD key for looking up existing appointments
  const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
  const todaysAppointments = apptsByDate.get(dateKey) ?? [];

  // Determine weekday 0=Sunday…6=Saturday
  const weekday = dayjs(selectedDate).day();

  // For each availability document…
  avails.forEach((avail) => {
    // If a specific provider is selected, skip the others
    if (selectedProvider !== "any" && avail.scopeId !== selectedProvider) {
      return;
    }

    // Each availability has a `.weekly` array of { weekday, slots: [ { start, end } ] }
    const daySchedule = avail.weekly.find((w) => w.weekday === weekday);
    if (!daySchedule) return;

    daySchedule.slots.forEach((timeSlot) => {
      // Build a slot object `{ start, end }` for this date
      const start = timeSlot.start; // e.g. "13:00"
      const end   = timeSlot.end;   // e.g. "14:30"

      // Check for collisions with any existing appointment
      const conflict = todaysAppointments.some((appt) => {
        const apptStart = dayjs(`${dateKey}T${(appt.startTime as any).toISOString().substr(11,5)}`);
        const apptEnd   = dayjs(`${dateKey}T${(appt.endTime   as any).toISOString().substr(11,5)}`);
        const slotStart = dayjs(`${dateKey}T${start}`);
        const slotEnd   = dayjs(`${dateKey}T${end}`);
        // overlap if slotStart < apptEnd && apptStart < slotEnd
        return slotStart.isBefore(apptEnd) && apptStart.isBefore(slotEnd);
      });

      if (!conflict) {
        slots.push({
          start,
          end,
          providerId: avail.scopeId,
        });
      }
    });
  });

  // Optionally, sort by start time
  slots.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

  return slots;
}
