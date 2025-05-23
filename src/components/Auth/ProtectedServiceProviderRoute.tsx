// src/components/Auth/ProtectedServiceProviderRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function ProtectedServiceProviderRoute() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()

  if (!user || !user.roles.includes('serviceProvider')) {
    return <Navigate to="/sign-in" replace />
  }

  const provIds = user.providerLocationIds || []

  if (!id) {
    if (provIds.length === 0) {
      return <Navigate to="/" replace />
    }
    if (provIds.length === 1) {
      return <Navigate to={`/service-provider/${provIds[0]}`} replace />
    }
    return <Outlet />
  }

  if (provIds.includes(id)) {
    return <Outlet />
  }

  if (provIds.length > 1) {
    return <Navigate to="/service-provider" replace />
  }
  return <Navigate to="/" replace />
}
