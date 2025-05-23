// src/components/BusinessForm/OwnerFields.tsx
import React from 'react'
import { Grid, TextField } from '@mui/material'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { BusinessFormProps } from './BusinessForm'

export default function OwnerFields({
  control,
  errors
}: Pick<BusinessFormProps, 'control' | 'errors'>) {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <Controller
          name="ownerName"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Owner Name" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="ownerEmail"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Owner Email" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="ownerPhone"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Owner Phone" />
          )}
        />
      </Grid>
    </>
  )
}
