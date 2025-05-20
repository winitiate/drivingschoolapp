// src/components/Auth/ProtectedClientRoute.tsx

/**
 * ProtectedClientRoute.tsx
 *
 * Restricts access to client-only routes.
 * Uses RBAC via ability.can('viewOwnTemplates').
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAbility } from '../../hooks/useAbility';

interface ProtectedClientRouteProps {
  /** Path to redirect unauthenticated or unauthorized users to */
  redirectPath?: string;
}

export default function ProtectedClientRoute({
  redirectPath = '/sign-in',
}: ProtectedClientRouteProps) {
  const { user, loading } = useAuth();
  const ability = useAbility();

  if (loading) {
    return <p>Loading…</p>;
  }

  // Must be signed in and have the 'viewOwnTemplates' permission (client or provider)
  if (!user || !ability.can('viewOwnTemplates')) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
