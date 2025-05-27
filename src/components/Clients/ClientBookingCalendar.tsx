// src/components/Client/ClientBookingCalendar.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarPicker, PickersDay } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';

interface ClientBookingCalendarProps {
  availableDates: Dayjs[];
  selectedDate: Dayjs | null;
  onDateSelect: (date: Dayjs) => void;
}

export default function ClientBookingCalendar({
  availableDates,
  selectedDate,
  onDateSelect,
}: ClientBookingCalendarProps) {
  // check if a day is in the availableDates array
  const isAvailable = (day: Dayjs) =>
    availableDates.some((d) => d.isSame(day, 'day'));

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select a Date
      </Typography>
      <CalendarPicker
        date={selectedDate}
        onChange={(d) => d && onDateSelect(d)}
        renderDay={(day, _value, DayComponentProps) => {
          const available = isAvailable(day);
          return (
            <PickersDay
              {...DayComponentProps}
              disabled={!available}
              sx={{ opacity: available ? 1 : 0.3 }}
            />
          );
        }}
      />
    </Box>
  );
}
