// src/components/Auth/ProtectedServiceLocationAdminRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Box, CircularProgress } from '@mui/material'

export default function ProtectedServiceLocationAdminRoute() {
  const { user, loading } = useAuth()
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>()

  // While we’re checking their auth state, show a spinner (no redirect!)
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  // Not signed in or not a serviceLocationAdmin → sign in
  if (!user || !user.roles.includes('serviceLocationAdmin')) {
    return <Navigate to="/sign-in" replace />
  }

  // Build the list of locations they administer
  const locIds = Array.from(new Set([
    ...(user.ownedLocationIds || []),
    ...(user.adminLocationIds || []),
  ]))

  // No :serviceLocationId in URL → decide where to go
  if (!serviceLocationId) {
    if (locIds.length === 0) {
      return <Navigate to="/" replace />
    }
    if (locIds.length === 1) {
      return <Navigate to={`/service-location/${locIds[0]}`} replace />
    }
    // multiple → show the selector page
    return <Outlet />
  }

  // A :serviceLocationId is present → allow if valid
  if (locIds.includes(serviceLocationId)) {
    return <Outlet />
  }

  // Invalid ID: if they have >1 locations, send back to selector, else home
  if (locIds.length > 1) {
    return <Navigate to="/service-location" replace />
  }
  return <Navigate to="/" replace />
}
