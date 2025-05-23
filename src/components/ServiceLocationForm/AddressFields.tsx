// src/components/ServiceLocationForm/AddressFields.tsx

import React from 'react'
import { Grid, TextField, Typography } from '@mui/material'
import type { ServiceLocation } from '../../models/ServiceLocation'

interface Props {
  address: ServiceLocation['address']
  onAddressChange: <K extends keyof ServiceLocation['address']>(
    key: K,
    val: ServiceLocation['address'][K]
  ) => void
}

export default function AddressFields({ address, onAddressChange }: Props) {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle1">Address</Typography>
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Street"
          fullWidth
          value={address.street}
          onChange={e => onAddressChange('street', e.target.value)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="City"
          fullWidth
          value={address.city}
          onChange={e => onAddressChange('city', e.target.value)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Province"
          fullWidth
          value={address.province}
          onChange={e => onAddressChange('province', e.target.value)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Postal Code"
          fullWidth
          value={address.postalCode}
          onChange={e => onAddressChange('postalCode', e.target.value)}
        />
      </Grid>
    </>
  )
}
