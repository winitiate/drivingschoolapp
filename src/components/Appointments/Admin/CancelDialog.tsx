import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from "@mui/material";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}
export default function CancelDialog({ open, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Cancel appointment</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Cancellation reason"
          fullWidth
          multiline
          minRows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!reason.trim()}
          onClick={() => onConfirm(reason.trim())}
        >
          Refund &amp; Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
