// src/components/Auth/ProtectedSuperAdminRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Box, CircularProgress } from '@mui/material';

interface Props {
  redirectPath?: string;
}

export default function ProtectedSuperAdminRoute({
  redirectPath = '/super-admin/sign-in',
}: Props) {
  const { user, loading } = useAuth();

  // While we’re checking auth, show a spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Not signed in or not a superAdmin → redirect to absolute path "/super-admin/sign-in"
  if (!user || !user.roles.includes('superAdmin')) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, render nested routes
  return <Outlet />;
}
