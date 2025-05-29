import React from "react";
import { Stack, Button, Alert, Typography } from "@mui/material";
import type { DailySlot } from "../../../models/Availability";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

interface Props {
  slots: DailySlot[];
  selectedDate: Dayjs;
  onSlotClick: (slot: DailySlot) => void;
}

export default function TimeSlots({ slots, selectedDate, onSlotClick }: Props) {
  if (slots.length === 0)
    return <Alert severity="info">No time slot available on this day.</Alert>;

  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Typography variant="subtitle1">Available Time Slots</Typography>
      {slots.map((s) => {
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
      })}
    </Stack>
  );
}
