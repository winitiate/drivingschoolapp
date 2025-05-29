import React from "react";
import { Box, Typography } from "@mui/material";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import type { Dayjs } from "dayjs";

interface Props {
  availableDates: Dayjs[];
  firstAvail: Dayjs | null;
  value: Dayjs | null;
  onChange: (d: Dayjs | null) => void;
}

export default function DateSelector({
  availableDates,
  firstAvail,
  value,
  onChange,
}: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6">Select a Date</Typography>
      <DateCalendar
        value={value ?? firstAvail}
        onChange={onChange}
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
  );
}
