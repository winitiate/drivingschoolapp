// src/components/Auth/ProtectedServiceLocationAdminRoute.tsx

/**
 * ProtectedServiceLocationAdminRoute.tsx
 *
 * Restricts access to service-location-admin routes.
 * Uses both RBAC and ABAC: only users with the
 * 'serviceLocationAdmin' role and membership in the
 * specified serviceLocation can access.
 */

import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAbility } from '../../hooks/useAbility';

interface ProtectedServiceLocationAdminRouteProps {
  /** Where to redirect if not authorized */
  redirectPath?: string;
}

export default function ProtectedServiceLocationAdminRoute({
  redirectPath = '/service-location/sign-in',
}: ProtectedServiceLocationAdminRouteProps) {
  const { user, loading } = useAuth();
  const ability = useAbility();
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Show a loading indicator while auth state is resolving
  if (loading) {
    return <p>Loading…</p>;
  }

  // Must be signed in
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Must have the 'serviceLocationAdmin' role and belong to the location
  const allowed = ability.can(
    'manageLocationTemplates',
    { ownerType: 'serviceLocation', ownerId: serviceLocationId }
  );

  if (!allowed) {
    return <Navigate to={redirectPath} replace />;
  }

  // Authorized — render nested routes
  return <Outlet />;
}
