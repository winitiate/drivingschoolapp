// src/components/BusinessForm/BusinessDetails.tsx
import React from 'react'
import { Grid, TextField } from '@mui/material'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { BusinessFormProps } from './BusinessForm'

export default function BusinessDetails({
  control,
  errors
}: Pick<BusinessFormProps, 'control' | 'errors'>) {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Name"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Email" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Phone" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Website" />
          )}
        />
      </Grid>
    </>
  )
}
