// src/pages/ServiceProvider/ServiceProviderFormDialog.tsx

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material'
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import type { ServiceProvider } from '../../models/ServiceProvider'
import { serviceProviderStore } from '../../data'
import ServiceProviderForm from '../../components/ServiceProviders/ServiceProviderForm'

interface Props {
  open: boolean
  serviceLocationId: string
  initialData?: ServiceProvider
  onClose: () => void
  onSave: (provider: ServiceProvider) => void
}

export default function ServiceProviderFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore()
  const isEdit = Boolean(initialData?.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<ServiceProvider>>({
    id: undefined,
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    licenseNumber: '',
    licenseClass: '',
    address: { street: '', city: '', postalCode: '' },
    backgroundCheck: { date: new Date(), status: 'pending' },
    rating: { average: 0, reviewCount: 0 },
    availability: [],
    blockedTimes: [],
    vehiclesCertifiedFor: [],
    providerLocationIds: [],
  })

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setForm({
        ...initialData,
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        providerLocationIds: initialData.providerLocationIds || [],
      })
    } else {
      setForm({
        id: undefined,
        userId: '',
        firstName: '',
        lastName: '',
        email: '',
        licenseNumber: '',
        licenseClass: '',
        address: { street: '', city: '', postalCode: '' },
        backgroundCheck: { date: new Date(), status: 'pending' },
        rating: { average: 0, reviewCount: 0 },
        availability: [],
        blockedTimes: [],
        vehiclesCertifiedFor: [],
        providerLocationIds: [],
      })
    }
    setError(null)
  }, [open, initialData])

  const handleFormChange = (
    data: Partial<ServiceProvider> & {
      email?: string
      firstName?: string
      lastName?: string
    }
  ) => {
    setForm(f => ({ ...f, ...data }))
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError(null)
    try {
      // 1) Resolve or create user by email
      const email = (form.email || '').trim().toLowerCase()
      let uid = form.userId || ''
      if (email) {
        const usersCol = collection(db, 'users')
        const snap = await getDocs(query(usersCol, where('email', '==', email)))
        if (!snap.empty) {
          uid = snap.docs[0].id
        } else {
          uid = uuidv4()
          await setDoc(doc(db, 'users', uid), {
            uid,
            email,
            firstName: form.firstName || '',
            lastName: form.lastName || '',
            roles: ['serviceProvider'],
            ownedBusinessIds: [],
            memberBusinessIds: [],
            ownedLocationIds: [],
            adminLocationIds: [],
            providerLocationIds: [],
            clientLocationIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      }

      // 2) Always write name back and ensure role + location linkage
      await updateDoc(doc(db, 'users', uid), {
        firstName: form.firstName || '',
        lastName: form.lastName || '',
        providerLocationIds: arrayUnion(serviceLocationId),
        roles: arrayUnion('serviceProvider'),
        updatedAt: serverTimestamp(),
      })

      // 3) Build ServiceProvider object
      const id = isEdit ? form.id! : uuidv4()
      const now = serverTimestamp() as any
      const provider: ServiceProvider = {
        ...(form as ServiceProvider),
        id,
        userId: uid,
        firstName: form.firstName || '',
        lastName: form.lastName || '',
        email,
        providerLocationIds: Array.from(
          new Set([...(form.providerLocationIds || []), serviceLocationId])
        ),
        createdAt: isEdit ? (form.createdAt as any) : now,
        updatedAt: now,
      }

      // 4) Persist ServiceProvider doc
      await serviceProviderStore.save(provider)

      onSave(provider)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to save provider')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>
        {isEdit ? 'Edit Service Provider' : 'Add Service Provider'}
      </DialogTitle>
      <DialogContent dividers>
        <ServiceProviderForm form={form} onChange={handleFormChange} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? (
            <Box display="flex" alignItems="center">
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving…
            </Box>
          ) : isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
