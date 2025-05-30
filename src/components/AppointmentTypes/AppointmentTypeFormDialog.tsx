import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Autocomplete,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { AppointmentType } from "../../models/AppointmentType";
import { AssessmentType } from "../../models/AssessmentType";

interface Props {
  open: boolean;
  serviceLocationId: string;
  initialData: AppointmentType | null;
  onClose: () => void;
  onSave: (appointmentType: AppointmentType) => Promise<void>;
  assessmentTypes: AssessmentType[];
}

export default function AppointmentTypeFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  assessmentTypes,
}: Props) {
  /* local state (UI strings) — price is dollars here */
  const [title, setTitle]         = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration]   = useState("");
  const [price, setPrice]         = useState(""); // dollars
  const [order, setOrder]         = useState("");
  const [linked, setLinked]       = useState<AssessmentType[]>([]);
  const [error, setError]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  /* ───────── populate on dialog open / initialData change ───────── */
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setDuration(
        initialData.durationMinutes != null ? String(initialData.durationMinutes) : ""
      );
      setPrice(
        initialData.priceCents != null ? String(initialData.priceCents / 100) : ""
      );
      setOrder(initialData.order != null ? String(initialData.order) : "");

      const ids = initialData.assessmentTypeIds ?? [];
      const selected = ids
        .map((id) => assessmentTypes.find((at) => at.id === id))
        .filter((at): at is AssessmentType => !!at);
      setLinked(selected);
    } else {
      setTitle("");
      setDescription("");
      setDuration("");
      setPrice("");
      setOrder("");
      setLinked([]);
    }
    setError(null);
  }, [initialData, assessmentTypes, open]);

  /* helper fns for list ordering */
  const moveLinked = (from: number, to: number) => {
    const arr = [...linked];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setLinked(arr);
  };
  const removeLinked = (idx: number) => setLinked(linked.filter((_, i) => i !== idx));

  /* ───────── save handler ───────── */
  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const durVal   = duration.trim() === "" ? null : parseInt(duration, 10);
    const orderVal = order.trim() === "" ? null : parseInt(order, 10);

    /* convert UI dollars → integer cents */
    const priceCents =
      price.trim() === "" ? null : Math.round(parseFloat(price) * 100);

    const payload: AppointmentType = {
      ...(initialData ?? { id: undefined }),
      serviceLocationId,
      title: title.trim(),
      description: description.trim() || null,
      durationMinutes: durVal,
      priceCents,
      order: orderVal,
      assessmentTypeIds: linked.map((a) => a.id!),
    };

    try {
      setSaving(true);
      setError(null);
      await onSave(payload);
    } catch (e: any) {
      setError(e.message || "Failed to save appointment type.");
    } finally {
      setSaving(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ style: { maxHeight: "90vh" } }}
    >
      <DialogTitle>
        {initialData ? "Edit Appointment Type" : "Add Appointment Type"}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Duration (min)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Price ($)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Order (optional)"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={assessmentTypes}
              getOptionLabel={(opt) => opt.title}
              value={linked}
              onChange={(_, v) => setLinked(v)}
              filterSelectedOptions
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assessment Types"
                  placeholder="Select…"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Selected Assessment Types (reorder / remove)
              </Typography>
              {linked.map((at, idx) => (
                <Box key={at.id} display="flex" alignItems="center" mb={1}>
                  <Typography sx={{ flexGrow: 1 }}>
                    {idx + 1}. {at.title}
                  </Typography>
                  {idx > 0 && (
                    <Button size="small" onClick={() => moveLinked(idx, idx - 1)}>
                      ↑
                    </Button>
                  )}
                  {idx < linked.length - 1 && (
                    <Button size="small" onClick={() => moveLinked(idx, idx + 1)}>
                      ↓
                    </Button>
                  )}
                  <IconButton size="small" onClick={() => removeLinked(idx)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
