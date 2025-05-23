// src/components/ServiceLocationForm/StatusFields.tsx

import React from 'react'
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import type { ServiceLocation } from '../../models/ServiceLocation'

interface Props {
  status: ServiceLocation['status']
  onStatusChange: (val: ServiceLocation['status']) => void
}

export default function StatusFields({ status, onStatusChange }: Props) {
  return (
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          value={status}
          onChange={e => onStatusChange(e.target.value as ServiceLocation['status'])}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  )
}
