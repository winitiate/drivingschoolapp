// src/pages/Client/ClientDashboard.tsx

/**
 * ClientDashboard.tsx
 *
 * Dashboard page showing upcoming appointments for the logged-in client.
 * Uses:
 *  • useAuth()               – to guard the route
 *  • useClientAppointments() – your abstraction over appointmentStore
 *  • AppointmentsTable       – presentational component only
 */

import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useClientAppointments } from '../../hooks/useClientAppointments';
import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { appointments, loading, error } = useClientAppointments(user?.uid || '');

  // Show spinner while auth is initializing
  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  // If not signed in (or missing client role), redirect to sign-in
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Client Dashboard
      </Typography>

      <AppointmentsTable
        appointments={appointments}
        loading={loading}
        error={error}
        onEdit={() => {
          /* you can wire this up to a “view details” or “reschedule” flow */
        }}
      />

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          component={RouterLink}
          to="/booking"
          variant="contained"
          color="primary"
        >
          Book An Appointment
        </Button>
      </Box>
    </Box>
  );
}
