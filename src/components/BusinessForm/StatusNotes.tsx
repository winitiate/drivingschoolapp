// src/components/BusinessForm/StatusNotes.tsx

import React from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export default function StatusNotes() {
  // Pull `control` and `formState.errors` from the enclosing FormProvider
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      {/* Status dropdown */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.status}>
          <InputLabel id="status-label">Status</InputLabel>
          <Controller
            name="status"
            control={control}
            defaultValue="active"
            render={({ field }) => (
              <Select
                {...field}
                labelId="status-label"
                label="Status"
                fullWidth
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            )}
          />
        </FormControl>
      </Grid>

      {/* Notes text area */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Notes"
              multiline
              rows={4}
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
          )}
        />
      </Grid>
    </>
  );
}
