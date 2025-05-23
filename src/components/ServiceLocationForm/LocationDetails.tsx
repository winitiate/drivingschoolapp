// src/components/ServiceLocationForm/LocationDetails.tsx

import React from 'react'
import { Grid, TextField } from '@mui/material'
import type { ServiceLocation } from '../../models/ServiceLocation'

interface Props {
  form: Partial<ServiceLocation>
  onChange: <K extends keyof ServiceLocation>(key: K, val: ServiceLocation[K]) => void
}

export default function LocationDetails({ form, onChange }: Props) {
  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="Location Name"
          fullWidth
          value={form.name}
          onChange={e => onChange('name', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Email"
          fullWidth
          value={form.email}
          onChange={e => onChange('email', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Phone"
          fullWidth
          value={form.phone}
          onChange={e => onChange('phone', e.target.value)}
        />
      </Grid>
    </>
  )
}
