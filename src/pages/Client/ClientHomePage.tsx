// src/pages/Client/ClientHomePage.tsx

/**
 * ClientHomePage.tsx
 *
 * Public landing page for prospective and returning clients.
 * If the user is signed in, shows a button to go straight to their dashboard.
 * Otherwise, prompts them to sign up or sign in.
 * Does not reference any domain-specific terms.
 */

import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export default function ClientHomePage() {
  const { user, loading: authLoading } = useAuth();

  // While auth state is initializing
  if (authLoading) {
    return (
      <Typography align="center" py={4}>
        Loading…
      </Typography>
    );
  }

  return (
    <Box textAlign="center" py={4}>
      <Typography variant="h3" gutterBottom>
        Welcome to the Service Portal
      </Typography>
      <Typography variant="body1" paragraph>
        Manage your appointments, track progress, and stay connected.
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
        mt={4}
      >
        {user ? (
          <Button
            component={RouterLink}
            to="/client"
            variant="contained"
            color="primary"
            size="large"
            fullWidth={{ xs: true, sm: false }}
          >
            Go to Dashboard
          </Button>
        ) : (
          <>
            <Button
              component={RouterLink}
              to="/sign-up"
              variant="contained"
              color="primary"
              size="large"
              fullWidth={{ xs: true, sm: false }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/sign-in"
              variant="outlined"
              size="large"
              fullWidth={{ xs: true, sm: false }}
            >
              Client Sign In
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
}
