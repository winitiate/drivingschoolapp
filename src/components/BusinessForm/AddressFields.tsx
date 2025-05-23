// src/components/BusinessForm/AddressFields.tsx
import React from 'react'
import { Grid, TextField } from '@mui/material'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { BusinessFormProps } from './BusinessForm'

export default function AddressFields({
  control,
  errors
}: Pick<BusinessFormProps, 'control' | 'errors'>) {
  return (
    <>
      <Grid item xs={12}>
        <Controller
          name="address.street"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Street" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="address.city"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="City" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="address.state"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="State / Province" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="address.zipCode"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Zip / Postal Code" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="address.country"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Country" />
          )}
        />
      </Grid>
    </>
  )
}
