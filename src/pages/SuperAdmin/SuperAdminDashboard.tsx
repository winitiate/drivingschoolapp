// src/pages/SuperAdmin/SuperAdminDashboard.tsx

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../../auth/useAuth';

/**
 * SuperAdminDashboard
 *
 * Renders a card‐based dashboard with links to:
 * - Businesses
 * - Onboarding settings
 * - Subscription Packages
 * - Payment settings
 * - Form templates
 */
export default function SuperAdminDashboard() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e.message || 'Failed to sign out');
    }
  };

  // label + destination for each dashboard card
  const sections: Array<[string, string]> = [
    ['Manage Businesses',          '/super-admin/businesses'],
    ['Business Onboarding Settings','/super-admin/business-onboarding'],
    ['Subscription Packages',      '/super-admin/subscription-packages'],
    ['Payment Settings',           '/super-admin/payment-settings'],
    ['Form Templates',             '/super-admin/form-templates'],
  ];

  if (authLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      component="main"
      sx={{ flex: 1, p: 3, maxWidth: 800, mx: 'auto' }}
    >
      <Typography variant="h5" gutterBottom>
        Platform Admin Dashboard
      </Typography>

      {user?.email && (
        <Typography
          variant="subtitle1"
          color="textSecondary"
          gutterBottom
        >
          Signed in as: {user.email}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2} direction="column">
          {sections.map(([label, to]) => (
            <Grid item xs={12} key={label}>
              <Card>
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6">{label}</Typography>
                  <Button
                    component={RouterLink}
                    to={to}
                    variant="outlined"
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}
