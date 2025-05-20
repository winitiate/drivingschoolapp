// src/components/Auth/ProtectedBusinessOwnerRoute.tsx

import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAbility } from '../../hooks/useAbility';

interface Props {
  redirectPath?: string;
}

export default function ProtectedBusinessOwnerRoute({
  redirectPath = '/business/sign-in'
}: Props) {
  const { user, loading } = useAuth();
  const ability = useAbility();
  const { businessId } = useParams<{ businessId: string }>();

  if (loading) {
    return <p>Loading…</p>;
  }

  // Must be signed in and have “viewBusinesses” permission on this business
  if (
    !user ||
    !businessId ||
    !ability.can('viewBusinesses', { ownerType: 'business', ownerId: businessId })
  ) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
