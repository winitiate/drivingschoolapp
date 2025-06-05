// src/pages/SuperAdmin/SuperAdminDashboard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Box 
} from '@mui/material';
import { useAuth } from '../../auth/useAuth';

export default function SuperAdminDashboard() {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();

  const handleManageBusinesses = () => {
    navigate('/super-admin/businesses');
  };

  const handleOnboardingSettings = () => {
    navigate('/super-admin/business-onboarding');
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/', { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6, textAlign: 'center' }}>
      {/* Main title */}
      <Typography variant="h4" gutterBottom>
        Platform Admin Dashboard
      </Typography>

      {/* Logged‐in user’s email */}
      {user?.email && (
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Welcome, {user.email}
        </Typography>
      )}

      {/* Action buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleManageBusinesses}
        >
          Manage Businesses
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleOnboardingSettings}
        >
          Business Onboarding Settings
        </Button>
      </Box>

      {/* Sign out */}
      <Box sx={{ mt: 4 }}>
        <Button variant="outlined" onClick={handleSignOut}>
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}
