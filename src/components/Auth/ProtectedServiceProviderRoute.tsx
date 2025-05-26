// src/components/Auth/ProtectedServiceProviderRoute.tsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Button, Typography } from '@mui/material';
import { useAuth } from '../../auth/useAuth';

/**
 * Wraps all /service-provider/* routes.
 * • While auth is loading, shows a spinner  
 * • If not signed in or lacks the serviceProvider role, redirects to sign-in  
 * • Otherwise renders child routes via <Outlet />
 */
export default function ProtectedServiceProviderRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !user.roles?.includes('serviceProvider')) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
