// src/components/Clients/ClientFormDialog.tsx

import React, { useState, useEffect, useMemo } from 'react'
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
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import type { Client } from '../../models/Client'
import { FirestoreClientStore } from '../../data/FirestoreClientStore'
import ClientForm from './ClientForm'

interface Props {
  open: boolean
  serviceLocationId: string
  initialData?: Client | null
  onClose: () => void
  onSave: (client: Client) => void
}

async function resolveUserByEmail(
  db: ReturnType<typeof getFirestore>,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  const normalized = email.trim().toLowerCase()
  const usersCol = collection(db, 'users')
  const snap = await getDocs(query(usersCol, where('email', '==', normalized)))
  if (!snap.empty) {
    return snap.docs[0].id
  }
  const uid = uuidv4()
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: normalized,
    firstName,
    lastName,
    roles: ['client'],
    ownedBusinessIds: [],
    memberBusinessIds: [],
    ownedLocationIds: [],
    adminLocationIds: [],
    providerLocationIds: [],
    clientLocationIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return uid
}

export default function ClientFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore()
  const store = useMemo(() => new FirestoreClientStore(), [])
  const isEdit = Boolean(initialData?.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<Client> & {
    firstName: string
    lastName: string
    email: string
    dateOfBirthStr: string
    learnerPermitExpiryStr: string
    roadTestAppointmentStr: string
    skillsMasteredStr: string
    otherDocsStr: string
  }>({
    id: undefined,
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    licenceNumber: '',
    licenceClass: '',
    dateOfBirthStr: '',
    address: { street: '', city: '', postalCode: '' },
    learnerPermitExpiryStr: '',
    emergencyContact: { name: '', relation: '', phone: '' },
    roadTestAppointmentStr: '',
    banned: false,
    banReason: '',
    progress: { totalLessons: 0, skillsMastered: [] },
    skillsMasteredStr: '',
    docs: { licenceCopyUrl: '', permitCopyUrl: '', other: [] },
    otherDocsStr: '',
    clientLocationIds: [],
  })

  useEffect(() => {
    if (!open) return

    if (initialData) {
      getDoc(doc(db, 'users', initialData.userId)).then(snap => {
        if (snap.exists()) {
          const d = snap.data() as any
          setForm(f => ({
            ...f,
            firstName: d.firstName || '',
            lastName:  d.lastName  || '',
            email:     d.email     || '',
          }))
        }
      })

      setForm(f => ({
        ...f,
        id: initialData.id,
        userId: initialData.userId,
        licenceNumber: initialData.licenceNumber || '',
        licenceClass: initialData.licenceClass || '',
        dateOfBirthStr: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().substr(0,10)
          : '',
        address: initialData.address || { street: '', city: '', postalCode: '' },
        learnerPermitExpiryStr: initialData.learnerPermitExpiry
          ? new Date(initialData.learnerPermitExpiry).toISOString().substr(0,10)
          : '',
        emergencyContact: initialData.emergencyContact || { name: '', relation: '', phone: '' },
        roadTestAppointmentStr: initialData.roadTestAppointment
          ? new Date(initialData.roadTestAppointment).toISOString().substr(0,16)
          : '',
        banned: initialData.banned || false,
        banReason: initialData.banReason || '',
        progress: {
          totalLessons: initialData.progress?.totalLessons || 0,
          skillsMastered: initialData.progress?.skillsMastered || [],
        },
        skillsMasteredStr: (initialData.progress?.skillsMastered || []).join(','),
        docs: {
          licenceCopyUrl: initialData.docs?.licenceCopyUrl || '',
          permitCopyUrl: initialData.docs?.permitCopyUrl || '',
          other: initialData.docs?.other || [],
        },
        otherDocsStr: (initialData.docs?.other || []).join(','),
        clientLocationIds: initialData.clientLocationIds || [],
      }))
    } else {
      setForm({
        id: undefined,
        userId: '',
        firstName: '',
        lastName: '',
        email: '',
        licenceNumber: '',
        licenceClass: '',
        dateOfBirthStr: '',
        address: { street: '', city: '', postalCode: '' },
        learnerPermitExpiryStr: '',
        emergencyContact: { name: '', relation: '', phone: '' },
        roadTestAppointmentStr: '',
        banned: false,
        banReason: '',
        progress: { totalLessons: 0, skillsMastered: [] },
        skillsMasteredStr: '',
        docs: { licenceCopyUrl: '', permitCopyUrl: '', other: [] },
        otherDocsStr: '',
        clientLocationIds: [],
      })
    }

    setError(null)
  }, [open, initialData, db])

  const handleFormChange = (data: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...data }))
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError(null)

    try {
      const uid = await resolveUserByEmail(
        db,
        form.email,
        form.firstName,
        form.lastName
      )

      // update user doc: link them as a client AND ensure they have the 'client' role
      await updateDoc(doc(db, 'users', uid), {
        clientLocationIds: arrayUnion(serviceLocationId),
        roles:            arrayUnion('client'),
        updatedAt:        serverTimestamp(),
      })

      const clientLocationIds = Array.from(new Set([
        ...(initialData?.clientLocationIds || []),
        serviceLocationId,
      ]))

      const id = isEdit ? initialData!.id : uuidv4()
      const client: Client = {
        id,
        userId: uid,
        clientLocationIds,
        licenceNumber: form.licenceNumber!,
        licenceClass: form.licenceClass!,
        dateOfBirth: form.dateOfBirthStr ? new Date(form.dateOfBirthStr) : null,
        address: form.address!,
        learnerPermitExpiry: form.learnerPermitExpiryStr
          ? new Date(form.learnerPermitExpiryStr)
          : null,
        emergencyContact: form.emergencyContact!,
        roadTestAppointment: form.roadTestAppointmentStr
          ? new Date(form.roadTestAppointmentStr)
          : null,
        banned: form.banned!,
        banReason: form.banned! ? form.banReason! : null,
        progress: {
          totalLessons: form.progress!.totalLessons,
          skillsMastered: form.skillsMasteredStr
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        },
        docs: {
          licenceCopyUrl: form.docs!.licenceCopyUrl,
          permitCopyUrl: form.docs!.permitCopyUrl,
          other: form.otherDocsStr
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        },
      }

      await store.save(client)
      onSave(client)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to save client')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle>
      <DialogContent dividers>
        <ClientForm form={form} onChange={handleFormChange} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
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
