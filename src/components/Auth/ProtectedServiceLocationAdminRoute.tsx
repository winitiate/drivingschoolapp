// src/components/Auth/ProtectedServiceLocationAdminRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function ProtectedServiceLocationAdminRoute() {
  const { user } = useAuth()
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>()

  if (!user || !user.roles.includes('serviceLocationAdmin')) {
    // not signed in or not a service-location admin → send to sign-in
    return <Navigate to="/sign-in" replace />
  }

  // combine owned + admin IDs
  const locIds = Array.from(
    new Set([
      ...(user.ownedLocationIds || []),
      ...(user.adminLocationIds || []),
    ])
  )

  // no `:serviceLocationId` in URL → decide where to go
  if (!serviceLocationId) {
    if (locIds.length === 0) {
      return <Navigate to="/" replace />
    }
    if (locIds.length === 1) {
      return (
        <Navigate
          to={`/service-location/${locIds[0]}`}
          replace
        />
      )
    }
    // multiple → show selector
    return <Outlet />
  }

  // detail route: `:serviceLocationId` present
  if (locIds.includes(serviceLocationId)) {
    return <Outlet />
  }

  // invalid `:serviceLocationId`
  if (locIds.length > 1) {
    return <Navigate to="/service-location" replace />
  }
  return <Navigate to="/" replace />
}
