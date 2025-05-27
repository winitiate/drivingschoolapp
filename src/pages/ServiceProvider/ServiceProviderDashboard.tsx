// src/pages/ServiceProvider/ServiceProviderDashboard.tsx

import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export default function ServiceProviderDashboard() {
  const { user, signOutUser } = useAuth();
  const { serviceProviderId } = useParams<{ serviceProviderId: string }>();

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Service Provider Dashboard
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Welcome, {user?.email}
      </Typography>

      <Box display="flex" justifyContent="center" gap={2} mt={3}>
        <Button
          component={RouterLink}
          to={`/service-provider/${serviceProviderId}/appointments`}
          variant="contained"
        >
          My Appointments
        </Button>
        <Button
          component={RouterLink}
          to={`/service-provider/${serviceProviderId}/availability`}
          variant="outlined"
        >
          Manage Availability
        </Button>
        <Button variant="outlined" onClick={signOutUser} color="inherit">
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}
