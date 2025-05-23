// src/components/ServiceLocationForm/ServiceLocationForm.tsx

import React from 'react'
import { Grid } from '@mui/material'
import type { ServiceLocation } from '../../models/ServiceLocation'
import OwnerFields from './OwnerFields'
import LocationDetails from './LocationDetails'
import AdditionalFields from './AdditionalFields'
import AddressFields from './AddressFields'
import StatusFields from './StatusFields'

interface Props {
  form: Partial<ServiceLocation>
  ownerEmail: string
  adminEmails: string
  onOwnerEmailChange: (email: string) => void
  onAdminEmailsChange: (emails: string) => void
  onChange: <K extends keyof ServiceLocation>(key: K, val: ServiceLocation[K]) => void
  onAddressChange: <K extends keyof ServiceLocation['address']>(
    key: K,
    val: ServiceLocation['address'][K]
  ) => void
}

export default function ServiceLocationForm({
  form,
  ownerEmail,
  adminEmails,
  onOwnerEmailChange,
  onAdminEmailsChange,
  onChange,
  onAddressChange,
}: Props) {
  return (
    <Grid container spacing={2}>
      <OwnerFields
        ownerEmail={ownerEmail}
        adminEmails={adminEmails}
        onOwnerEmailChange={onOwnerEmailChange}
        onAdminEmailsChange={onAdminEmailsChange}
      />

      <LocationDetails form={form} onChange={onChange} />

      <AdditionalFields form={form} onChange={onChange} />

      <AddressFields
        address={form.address!}
        onAddressChange={onAddressChange}
      />

      <StatusFields
        status={form.status!}
        onStatusChange={val => onChange('status', val)}
      />
    </Grid>
  )
}
