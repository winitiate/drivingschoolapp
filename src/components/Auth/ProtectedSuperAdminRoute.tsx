// src/components/Auth/ProtectedSuperAdminRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedSuperAdminRoute({ redirectPath = '/super-admin/sign-in' }) {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    console.log('[ProtectedRoute] loading:', loading, 'user:', user);
    console.log('[ProtectedRoute] roles:', user?.roles);
  }, [loading, user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If user is null or not a superAdmin, redirect.
  if (!user || !Array.isArray(user.roles) || !user.roles.includes('superAdmin')) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
