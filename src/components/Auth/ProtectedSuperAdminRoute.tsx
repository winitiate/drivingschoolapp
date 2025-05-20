// src/components/Auth/ProtectedSuperAdminRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAbility } from '../../hooks/useAbility';

interface ProtectedSuperAdminRouteProps {
  redirectPath?: string;
}

export default function ProtectedSuperAdminRoute({
  redirectPath = '/super-admin/sign-in',
}: ProtectedSuperAdminRouteProps) {
  const { user, loading } = useAuth();
  const ability = useAbility();

  // Show a loading indicator while auth state is resolving
  if (loading) {
    return <p>Loading…</p>;
  }

  // Not signed in → redirect to sign-in
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Must have the `manageBusinesses` permission (super-admin only)
  if (!ability.can('manageBusinesses')) {
    return <Navigate to={redirectPath} replace />;
  }

  // Authorized — render nested routes
  return <Outlet />;
}
