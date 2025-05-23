// src/components/Auth/ProtectedSuperAdminRoute.tsx

import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

interface Props {
  redirectPath?: string
}

export default function ProtectedSuperAdminRoute({
  redirectPath = '/super-admin/sign-in',
}: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p>Loading…</p>
  }

  if (!user || !user.roles.includes('superAdmin')) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
