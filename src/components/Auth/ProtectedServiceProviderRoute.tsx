// src/components/Auth/ProtectedServiceProviderRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Box, CircularProgress } from '@mui/material'

export default function ProtectedServiceProviderRoute() {
  const { user, loading } = useAuth()
  const { id } = useParams<{ id: string }>()

  // While we’re checking auth, render a spinner instead of redirecting immediately
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  // Must be signed in with the serviceProvider role
  if (!user || !user.roles.includes('serviceProvider')) {
    return <Navigate to="/sign-in" replace />
  }

  const provIds = user.providerLocationIds || []

  // No `:id` → decide where to go
  if (!id) {
    if (provIds.length === 0) {
      return <Navigate to="/" replace />
    }
    if (provIds.length === 1) {
      return <Navigate to={`/service-provider/${provIds[0]}`} replace />
    }
    return <Outlet />
  }

  // `:id` present → allow only if valid
  if (provIds.includes(id)) {
    return <Outlet />
  }

  // Invalid `:id` → back to selector or home
  if (provIds.length > 1) {
    return <Navigate to="/service-provider" replace />
  }
  return <Navigate to="/" replace />
}
