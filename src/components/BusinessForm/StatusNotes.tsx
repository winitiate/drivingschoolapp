// src/components/BusinessForm/StatusNotes.tsx
import React from 'react'
import { Grid, TextField, MenuItem } from '@mui/material'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { BusinessFormProps } from './BusinessForm'

const statusOptions = ['active', 'pending', 'suspended', 'closed']

export default function StatusNotes({
  control,
  errors
}: Pick<BusinessFormProps, 'control' | 'errors'>) {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth select label="Status">
              {statusOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={3}
              label="Notes"
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
          )}
        />
      </Grid>
    </>
  )
}
