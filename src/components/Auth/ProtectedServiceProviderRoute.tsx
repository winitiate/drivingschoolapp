// src/components/Auth/ProtectedServiceProviderRoute.tsx

/**
 * ProtectedServiceProviderRoute.tsx
 *
 * Restricts access to service-provider-only routes.
 * Uses RBAC via ability.can('viewOwnTemplates').
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAbility } from '../../hooks/useAbility';

interface ProtectedServiceProviderRouteProps {
  redirectPath?: string;
}

export default function ProtectedServiceProviderRoute({
  redirectPath = '/provider/sign-in',
}: ProtectedServiceProviderRouteProps) {
  const { user, loading } = useAuth();
  const ability = useAbility();

  if (loading) {
    return <p>Loading…</p>;
  }

  // Must be signed in and have the provider/client template-view permission
  if (!user || !ability.can('viewOwnTemplates')) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
