// src/pages/Client/ClientProfile.tsx

/**
 * ClientProfile.tsx
 *
 * Page where a signed-in client can view their profile details.
 * Uses the useAuth abstraction to get user info and sign out.
 */

import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../../auth/useAuth';

export default function ClientProfile() {
  const { user, loading, signOutUser } = useAuth();

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Typography align="center" mt={4}>Please sign in to view your profile.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Typography>
        <strong>Name:</strong> {user.firstName} {user.lastName}
      </Typography>
      <Typography>
        <strong>Email:</strong> {user.email}
      </Typography>
      {/* Future: allow editing profile fields */}
      <Box sx={{ mt: 4 }}>
        <Button variant="outlined" onClick={signOutUser}>
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
