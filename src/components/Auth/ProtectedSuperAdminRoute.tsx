// src/components/ProtectedSuperAdminRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

interface ProtectedSuperAdminRouteProps {
  redirectPath?: string;
}

export default function ProtectedSuperAdminRoute({
  redirectPath = '/super-admin/sign-in',
}: ProtectedSuperAdminRouteProps) {
  const { user, loading } = useAuth();

  // Show a spinner while we’re waiting for auth
  if (loading) {
    return <p>Loading…</p>;
  }

  // Not signed in? Send to sign-in page
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Signed in but missing the superAdmin role? Kick back to sign-in
  if (!user.roles.includes('superAdmin')) {
    return <Navigate to={redirectPath} replace />;
  }

  // Authorized — render child routes
  return <Outlet />;
}
