// src/components/Auth/ProtectedClientRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function ProtectedClientRoute() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()

  if (!user || !user.roles.includes('client')) {
    return <Navigate to="/sign-in" replace />
  }

  const clientIds = user.clientLocationIds || []

  if (!id) {
    if (clientIds.length === 0) {
      return <Navigate to="/" replace />
    }
    if (clientIds.length === 1) {
      return <Navigate to={`/client/${clientIds[0]}`} replace />
    }
    return <Outlet />
  }

  if (clientIds.includes(id)) {
    return <Outlet />
  }

  if (clientIds.length > 1) {
    return <Navigate to="/client" replace />
  }
  return <Navigate to="/" replace />
}
