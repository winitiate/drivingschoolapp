// src/components/Appointments/AppointmentFormDialog/CancelSection.tsx

import React from "react";
import { Box, Typography, TextField } from "@mui/material";

interface CancelSectionProps {
  cancelReason: string;
  onChange: (reason: string) => void;
}

export function CancelSection({ cancelReason, onChange }: CancelSectionProps) {
  return (
    <Box mt={2}>
      <Typography variant="subtitle1">Cancellation Reason</Typography>
      <TextField
        multiline
        minRows={2}
        value={cancelReason}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        placeholder="Reason for cancellation…"
      />
    </Box>
  );
}
