// src/components/BusinessForm/BusinessForm.tsx
import React from 'react'
import { Control, FieldErrors } from 'react-hook-form'

import BusinessDetails from './BusinessDetails'
import AddressFields   from './AddressFields'
import OwnerFields     from './OwnerFields'
import StatusNotes     from './StatusNotes'

export interface BusinessFormProps {
  control: Control<any>
  errors: FieldErrors<any>
}

export default function BusinessForm({ control, errors }: BusinessFormProps) {
  return (
    <>
      <BusinessDetails control={control} errors={errors} />
      <AddressFields   control={control} errors={errors} />
      <OwnerFields     control={control} errors={errors} />
      <StatusNotes     control={control} errors={errors} />
    </>
  )
}
