// src/components/ServiceLocationForm/AdditionalFields.tsx

import React from 'react'
import { Grid, TextField } from '@mui/material'
import type { ServiceLocation } from '../../models/ServiceLocation'

interface Props {
  form: Partial<ServiceLocation>
  onChange: <K extends keyof ServiceLocation>(key: K, val: ServiceLocation[K]) => void
}

export default function AdditionalFields({ form, onChange }: Props) {
  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="Website URL"
          fullWidth
          value={form.websiteUrl}
          onChange={e => onChange('websiteUrl', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="About"
          fullWidth
          multiline
          rows={3}
          value={form.about}
          onChange={e => onChange('about', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Policy"
          fullWidth
          multiline
          rows={3}
          value={form.policy}
          onChange={e => onChange('policy', e.target.value)}
        />
      </Grid>
    </>
  )
}
