// src/components/ServiceProviders/ServiceProviderForm.tsx

import React from 'react'
import { Grid, TextField } from '@mui/material'
import type { ServiceProvider } from '../../models/ServiceProvider'

interface Props {
  form: Partial<ServiceProvider> & {
    email: string
    firstName: string
    lastName: string
  }
  onChange(data: Partial<ServiceProvider> & { email: string, firstName: string, lastName: string }): void
}

export default function ServiceProviderForm({ form, onChange }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="First Name"
          fullWidth
          value={form.firstName || ''}
          onChange={e => onChange({ firstName: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Last Name"
          fullWidth
          value={form.lastName || ''}
          onChange={e => onChange({ lastName: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={form.email || ''}
          onChange={e => onChange({ email: e.target.value })}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="License Number"
          fullWidth
          value={form.licenseNumber || ''}
          onChange={e => onChange({ licenseNumber: e.target.value })}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="License Class"
          fullWidth
          value={form.licenseClass || ''}
          onChange={e => onChange({ licenseClass: e.target.value })}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Street"
          fullWidth
          value={form.address?.street || ''}
          onChange={e => onChange({ address: { ...(form.address||{}), street: e.target.value } })}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="City"
          fullWidth
          value={form.address?.city || ''}
          onChange={e => onChange({ address: { ...(form.address||{}), city: e.target.value } })}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Postal Code"
          fullWidth
          value={form.address?.postalCode || ''}
          onChange={e => onChange({ address: { ...(form.address||{}), postalCode: e.target.value } })}
        />
      </Grid>
    </Grid>
)
}
