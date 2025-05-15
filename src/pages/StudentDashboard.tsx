// src/pages/StudentDashboard.tsx
import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useStudentAppointments } from '../hooks/useStudentAppointments';
import AppointmentTable from '../components/Appointments/AppointmentsTable';
import { Box, Button, Typography } from '@mui/material';

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { appointments, loading: apptLoading } = useStudentAppointments(user?.uid || '');

  // While auth state is initializing
  if (authLoading) {
    return <Typography>Loading profile…</Typography>;
  }

  // If not logged in, redirect to sign-in
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Student Dashboard
      </Typography>

      {apptLoading ? (
        <Typography>Loading appointments…</Typography>
      ) : appointments.length > 0 ? (
        <AppointmentTable appointments={appointments} />
      ) : (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography>No upcoming lessons scheduled.</Typography>
          <Button
            component={RouterLink}
            to="/booking"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Book A Lesson
          </Button>
        </Box>
      )}
    </Box>
  );
}
