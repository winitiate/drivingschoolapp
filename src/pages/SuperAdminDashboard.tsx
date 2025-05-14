// src/pages/SuperAdminDashboard.tsx
import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useAuth } from '../auth/useAuth';
import { Link as RouterLink } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const { user, signOutUser } = useAuth();

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} textAlign="center">
        <Typography variant="h4">Platform Admin Dashboard</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome, {user?.email}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" gap={2} mb={4}>
        <Button
          component={RouterLink}
          to="/super-admin/schools"
          variant="contained"
        >
          Manage Schools
        </Button>
        <Button
          variant="outlined"
          onClick={signOutUser}
        >
          Sign Out
        </Button>
      </Box>

      {/* TODO: add stats, pending requests, etc. */}
    </Container>
  );
}
