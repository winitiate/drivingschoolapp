// src/pages/ServiceProvider/ServiceProviderDashboard.tsx

import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../auth/useAuth';
import { Link as RouterLink } from 'react-router-dom';

export default function ServiceProviderDashboard() {
  const { user, signOutUser } = useAuth();

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} textAlign="center">
        <Typography variant="h4">Service Provider Dashboard</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome, {user?.email}
        </Typography>
      </Box>

      {/* TODO: Add service provider–specific portal content here */}
      <Box display="flex" justifyContent="center" gap={2} mb={4}>
        <Button
          component={RouterLink}
          to="/service-provider/appointments"
          variant="contained"
        >
          My Appointments
        </Button>
        <Button
          color="inherit"
          onClick={signOutUser}
          variant="outlined"
        >
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}
