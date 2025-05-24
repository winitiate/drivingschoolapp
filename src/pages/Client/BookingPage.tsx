// src/pages/Client/BookingPage.tsx

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { Box, CircularProgress, Alert } from '@mui/material'

import AppointmentFormDialog from '../../components/Appointments/AppointmentFormDialog'
import { FirestoreAppointmentTypeStore } from '../../data/FirestoreAppointmentTypeStore'
import { FirestoreServiceProviderStore } from '../../data/FirestoreServiceProviderStore'
import type { Appointment } from '../../models/Appointment'

export default function BookingPage() {
  // 1) Grab the service-location ID from the URL
  const { id: locId } = useParams<{ id: string }>()
  const { user } = useAuth()

  // 2) Must be signed in
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  // 3) Must belong to this location
  const clientLocIds = user.clientLocationIds || []
  if (!locId || !clientLocIds.includes(locId)) {
    return <Navigate to="/" replace />
  }

  // 4) Prepare stores & Firestore reference
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), [])
  const providerStore = useMemo(
    () => new FirestoreServiceProviderStore(),
    []
  )
  const db = useMemo(() => getFirestore(), [])

  // 5) Local state
  const [types, setTypes] = useState<{ id: string; title: string }[]>([])
  const [providers, setProviders] = useState<{ id: string; name: string }[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(true)

  // 6) Load providers & types for this location
  useEffect(() => {
    setLoading(true)
    Promise.all([
      providerStore.listByServiceLocation(locId),
      typeStore.listByServiceLocation(locId),
    ])
      .then(async ([provList, typeList]) => {
        // resolve provider names from users collection
        const provs = await Promise.all(
          provList.map(async (p) => {
            const snap = await getDoc(doc(db, 'users', p.id))
            const d = snap.exists() ? (snap.data() as any) : {}
            return {
              id: p.id,
              name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
            }
          })
        )
        setProviders(provs)
        setTypes(typeList.map((t) => ({ id: t.id, title: t.title })))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [locId, providerStore, typeStore, db])

  // 7) After booking, just close the dialog (or redirect as you like)
  const handleSave = (apt: Appointment) => {
    setDialogOpen(false)
  }

  // 8) Render states
  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  // 9) Show the actual appointment form
  return (
    <AppointmentFormDialog
      open={dialogOpen}
      serviceLocationId={locId}
      onClose={() => setDialogOpen(false)}
      onSave={handleSave}
      clients={[
        {
          id: user.uid,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        },
      ]}
      serviceProviders={providers}
      appointmentTypes={types}
    />
  )
}
