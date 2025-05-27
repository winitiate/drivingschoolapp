// src/components/Client/TimeSlotsList.tsx

import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export interface TimeSlot {
  start: string; // "HH:mm"
  end:   string; // "HH:mm"
}

interface TimeSlotsListProps {
  slots: TimeSlot[];
  onSlotSelect: (slot: TimeSlot) => void;
}

export default function TimeSlotsList({
  slots,
  onSlotSelect,
}: TimeSlotsListProps) {
  if (slots.length === 0) {
    return (
      <Typography variant="body1" sx={{ mt: 2 }}>
        No available time slots for this date.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Available Time Slots
      </Typography>
      {slots.map((slot) => (
        <Button
          key={`${slot.start}-${slot.end}`}
          variant="outlined"
          onClick={() => onSlotSelect(slot)}
        >
          {slot.start} – {slot.end}
        </Button>
      ))}
    </Box>
  );
}
