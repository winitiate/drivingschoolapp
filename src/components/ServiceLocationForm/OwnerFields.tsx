// src/components/ServiceLocationForm/OwnerFields.tsx

import React from 'react'
import { Grid, TextField } from '@mui/material'

interface Props {
  ownerEmail: string
  adminEmails: string
  onOwnerEmailChange: (val: string) => void
  onAdminEmailsChange: (val: string) => void
}

export default function OwnerFields({
  ownerEmail,
  adminEmails,
  onOwnerEmailChange,
  onAdminEmailsChange,
}: Props) {
  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="Owner Email"
          fullWidth
          value={ownerEmail}
          onChange={e => onOwnerEmailChange(e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Admin Emails (comma separated)"
          fullWidth
          value={adminEmails}
          onChange={e => onAdminEmailsChange(e.target.value)}
        />
      </Grid>
    </>
  )
}
