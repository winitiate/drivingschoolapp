import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import type { Dayjs } from "dayjs";
import type { DailySlot } from "../../../models/Availability";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  typeTitle: string;
  providerName: string;
  selectedDate: Dayjs | null;
  selectedSlot: DailySlot | null;
}

export default function ConfirmAppointmentDialog({
  open,
  onClose,
  onConfirm,
  clientName,
  typeTitle,
  providerName,
  selectedDate,
  selectedSlot,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Your Appointment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          <Typography>
            <strong>Client:</strong> {clientName}
          </Typography>
          <Typography>
            <strong>Type:</strong> {typeTitle}
          </Typography>
          <Typography>
            <strong>Provider:</strong> {providerName}
          </Typography>
          <Typography>
            <strong>Date & Time:</strong>{" "}
            {selectedDate?.format("dddd, MMMM D, YYYY")}{" "}
            {selectedSlot
              ? dayjs(selectedSlot.start, "HH:mm").format("h:mmA")
              : ""}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>
          Book Now
        </Button>
      </DialogActions>
    </Dialog>
  );
}
