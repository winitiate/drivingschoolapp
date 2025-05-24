// src/pages/Client/ClientDashboard.tsx

import React from 'react'
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useClientAppointments } from '../../hooks/useClientAppointments'
import AppointmentsTable from '../../components/Appointments/AppointmentsTable'
import { Box, Button, Typography, CircularProgress } from '@mui/material'

export default function ClientDashboard() {
  const { id: locId } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { appointments, loading, error } = useClientAppointments(user?.uid || '')

  // spinner while auth
  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  // not signed in / not a client
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  // missing locId param
  if (!locId) {
    return <Navigate to="/" replace />
  }

  // build the link using that same locId
  const bookingLink = `/client/${locId}/booking`

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Client Dashboard
      </Typography>

      <AppointmentsTable
        appointments={appointments}
        loading={loading}
        error={error}
        onEdit={() => {}
        }
      />

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          component={RouterLink}
          to={bookingLink}
          variant="contained"
          color="primary"
        >
          Book An Appointment
        </Button>
      </Box>
    </Box>
  )
}
