// src/components/BusinessForm/BusinessDetails.tsx

import React from 'react'
import { Grid, TextField } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

export default function BusinessDetails() {
  // Grab `control` and `formState.errors` from the enclosing FormProvider
  const {
    control,
    formState: { errors },
  } = useFormContext()

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
            <TextField
              {...field}
              fullWidth
              label="Email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Phone"
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Website"
              error={!!errors.website}
              helperText={errors.website?.message}
            />
          )}
        />
      </Grid>
    </>
  )
}
