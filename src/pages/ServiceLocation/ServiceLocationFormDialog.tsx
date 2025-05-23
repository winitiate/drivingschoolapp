// src/pages/ServiceLocation/ServiceLocationFormDialog.tsx

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
import { v4 as uuidv4 } from 'uuid'
import {
  getFirestore,
  collection,
  getDoc,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type { ServiceLocation } from '../../models/ServiceLocation'
import { serviceLocationStore } from '../../data'
import ServiceLocationForm from '../../components/ServiceLocationForm'

interface Props {
  open: boolean
  businessId: string
  initialData?: ServiceLocation
  onClose: () => void
  onSave: (loc: ServiceLocation) => void
}

export default function ServiceLocationFormDialog({
  open,
  businessId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore()
  const isEdit = Boolean(initialData?.id)

  const [form, setForm] = useState<Partial<ServiceLocation>>({
    id: undefined,
    businessId,
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', province: '', postalCode: '' },
    geo: { lat: 0, lng: 0 },
    websiteUrl: '',
    logoUrl: '',
    about: '',
    policy: '',
    faqIds: [],
    serviceProviderIds: [],
    clientIds: [],
    ownerId: '',
    adminIds: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '',
    updatedBy: '',
  })
  const [ownerEmail, setOwnerEmail] = useState<string>('')
  const [adminEmails, setAdminEmails] = useState<string>('')
  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setForm({ ...initialData, businessId })
      ;(async () => {
        if (initialData.ownerId) {
          const snap = await getDoc(doc(db, 'users', initialData.ownerId))
          setOwnerEmail(snap.exists() ? (snap.data().email as string) : '')
        } else {
          setOwnerEmail('')
        }
        if (initialData.adminIds?.length) {
          const snaps = await Promise.all(
            initialData.adminIds.map(uid => getDoc(doc(db, 'users', uid)))
          )
          const emails = snaps
            .filter(s => s.exists())
            .map(s => s.data().email as string)
            .filter(Boolean)
          setAdminEmails(emails.join(', '))
        } else {
          setAdminEmails('')
        }
      })()
    } else {
      setForm(f => ({ ...f, id: undefined, businessId }))
      setOwnerEmail('')
      setAdminEmails('')
    }
    setError(null)
  }, [open, initialData, businessId, db])

  const handleChange = <K extends keyof ServiceLocation>(
    key: K,
    value: ServiceLocation[K]
  ) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleNested = <
    S extends 'address' | 'geo',
    K extends keyof ServiceLocation[S]
  >(
    section: S,
    key: K,
    value: ServiceLocation[S][K]
  ) => {
    setForm(f => ({
      ...f,
      [section]: { ...(f[section] as any), [key]: value },
    }))
  }

  const resolveEmails = async (emails: string[]): Promise<string[]> => {
    const uids: string[] = []
    for (let raw of emails) {
      const email = raw.trim().toLowerCase()
      if (!email) continue
      const snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
      )
      if (!snap.empty) {
        uids.push(snap.docs[0].id)
      } else {
        const uid = uuidv4()
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          roles: [],
          ownedBusinessIds: [],
          memberBusinessIds: [],
          ownedLocationIds: [],
          adminLocationIds: [],
          providerLocationIds: [],
          clientLocationIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        uids.push(uid)
      }
    }
    return uids
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError(null)
    try {
      let ownerId = form.ownerId || ''
      if (ownerEmail) {
        [ownerId] = await resolveEmails([ownerEmail])
      }

      let adminIds = form.adminIds || []
      if (adminEmails) {
        adminIds = await resolveEmails(adminEmails.split(','))
      }

      const id = isEdit ? form.id! : uuidv4()
      const now = serverTimestamp() as Timestamp
      const loc: ServiceLocation = {
        ...(form as ServiceLocation),
        id,
        ownerId,
        adminIds,
        businessId,
        createdAt: isEdit ? (form.createdAt as any) : now,
        updatedAt: now,
      }

      await serviceLocationStore.save(loc)

      if (ownerId) {
        await updateDoc(doc(db, 'users', ownerId), {
          ownedLocationIds: arrayUnion(id),
          roles: arrayUnion('serviceLocationAdmin'),
          updatedAt: serverTimestamp(),
        })
      }
      await Promise.all(
        adminIds.map(uid =>
          updateDoc(doc(db, 'users', uid), {
            adminLocationIds: arrayUnion(id),
            roles: arrayUnion('serviceLocationAdmin'),
            updatedAt: serverTimestamp(),
          })
        )
      )

      onSave(loc)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle>
        {isEdit ? 'Edit Service Location' : 'Add Service Location'}
      </DialogTitle>

      <DialogContent dividers>
        <ServiceLocationForm
          form={form}
          ownerEmail={ownerEmail}
          adminEmails={adminEmails}
          onOwnerEmailChange={setOwnerEmail}
          onAdminEmailsChange={setAdminEmails}
          onChange={handleChange}
          onAddressChange={handleNested}
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy}
        >
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
