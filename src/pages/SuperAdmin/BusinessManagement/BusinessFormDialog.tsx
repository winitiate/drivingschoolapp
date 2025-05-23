// src/pages/SuperAdmin/BusinessManagement/BusinessFormDialog.tsx

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid
} from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import { businessStore } from '../../../data'
import { Business } from '../../../models/Business'
import { db } from '../../../firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  doc,
  arrayUnion
} from 'firebase/firestore'
import BusinessForm from '../../../components/BusinessForm/BusinessForm'

interface Props {
  open: boolean
  onClose: () => void
  business?: Business | null
  onSaved: () => void
}

// Recursively strip undefined
function deepCleanObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(deepCleanObject)
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, deepCleanObject(v)])
    )
  }
  return obj
}

export default function BusinessFormDialog({
  open,
  onClose,
  business,
  onSaved
}: Props) {
  const methods = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      status: 'active',
      notes: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      ownerName: '',
      ownerEmail: '',
      ownerPhone: ''
    }
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = methods

  useEffect(() => {
    reset({
      name:     business?.name     || '',
      email:    business?.email    || '',
      phone:    business?.phone    || '',
      website:  business?.website  || '',
      status:   business?.status   || 'active',
      notes:    business?.notes    || '',
      address: {
        street:  business?.address?.street  || '',
        city:    business?.address?.city    || '',
        state:   business?.address?.state   || '',
        zipCode: business?.address?.zipCode || '',
        country: business?.address?.country || ''
      },
      ownerName:  business?.ownerName  || '',
      ownerEmail: business?.ownerEmail || '',
      ownerPhone: business?.ownerPhone || ''
    })
  }, [business, reset])

  const onSubmit = async (data: any) => {
    const bizId = business?.id || uuidv4()

    let ownerId: string | undefined
    if (data.ownerEmail) {
      const q = query(
        collection(db, 'users'),
        where('email', '==', data.ownerEmail)
      )
      const snaps = await getDocs(q)
      if (!snaps.empty) ownerId = snaps.docs[0].id
    }

    const draft: Business = {
      id:        bizId,
      createdAt: business?.createdAt || new Date(),
      updatedAt: new Date(),
      name:      data.name,
      email:     data.email,
      phone:     data.phone,
      website:   data.website,
      status:    data.status,
      notes:     data.notes,
      address:   data.address,
      ownerName:  data.ownerName,
      ownerEmail: data.ownerEmail,
      ownerPhone: data.ownerPhone,
      ...(ownerId ? { ownerId } : {})
    }

    const cleaned = deepCleanObject(draft) as Business
    await businessStore.save(cleaned)

    if (ownerId) {
      const userRef = doc(db, 'users', ownerId)
      await updateDoc(userRef, {
        roles:            arrayUnion('business'),
        ownedBusinessIds: arrayUnion(bizId),
        updatedAt:        serverTimestamp()
      })
    }

    onSaved()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {business ? 'Edit Business' : 'New Business'}
      </DialogTitle>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} mt={1}>
              <BusinessForm control={control} errors={errors} />
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              {business ? 'Save Changes' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}
