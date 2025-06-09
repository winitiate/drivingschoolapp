/**
 * src/components/Appointments/AppointmentFormDialog/RescheduleSection.tsx
 *
 * Displays a date calendar and time slots for rescheduling an appointment.
 * Wraps calendar values in Dayjs so .toDate() is always available.
 */

import React from "react";
import { Box, Typography, CircularProgress, Button, Stack } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";

import type { DailySlot } from "../../../models/Availability";
import type { AppointmentMap } from "../../../hooks/useAppointmentsMap";
import type { Option } from "./types";

export interface RescheduleSectionProps {
  serviceProviderId: string;
  onChangeProvider: (id: string) => void;
  availabilities: { date: string; slots: DailySlot[] }[];
  apptsByDate: AppointmentMap;
  providerOptions: Option[];
  availabilityLoading: boolean;
  availableDates: Dayjs[];
  selectedDate: Dayjs;
  onChangeDate: (d: Dayjs) => void;
  slots: DailySlot[];
  onSelectSlot: (slot: DailySlot) => void;
}

const RescheduleSection: React.FC<RescheduleSectionProps> = ({
  serviceProviderId,
  onChangeProvider,
  availabilities,
  apptsByDate,
  providerOptions,
  availabilityLoading,
  availableDates,
  selectedDate,
  onChangeDate,
  slots,
  onSelectSlot,
}) => {
  if (availabilityLoading) {
    return (
      <Box textAlign="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (availableDates.length === 0) {
    return <Typography>No dates available for rescheduling</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Reschedule</Typography>
      <DateCalendar
        value={selectedDate}
        onChange={newDate => newDate && onChangeDate(dayjs(newDate))}
        shouldDisableDate={day =>
          !availableDates.some(d => d.isSame(day, "day"))
        }
        showDaysOutsideCurrentMonth
      />
      <Box>
        {slots.length === 0 ? (
          <Typography>No time slots available on this day.</Typography>
        ) : (
          <Stack spacing={1}>
            {slots.map(slot => (
              <Button
                key={slot.start}
                variant="outlined"
                onClick={() => onSelectSlot(slot)}
              >
                {slot.start} - {slot.end}
              </Button>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

export { RescheduleSection };
export default RescheduleSection;
