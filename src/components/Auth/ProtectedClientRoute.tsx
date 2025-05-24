// src/components/Auth/ProtectedClientRoute.tsx

import React from 'react'
import { Navigate, Outlet, useMatch } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Box, CircularProgress } from '@mui/material'

export default function ProtectedClientRoute() {
  const { user, loading } = useAuth()

  // Grab “id” only if the URL matches /client/:id/*
  const match = useMatch('/client/:id/*')
  const id = match?.params.id

  // 1) While auth is initializing, show a spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  // 2) Must be signed in and have the “client” role
  if (!user || !user.roles.includes('client')) {
    return <Navigate to="/sign-in" replace />
  }

  const clientIds = user.clientLocationIds || []

  // 3) No “id” in the URL → choose:
  if (!id) {
    // 3a) zero locations → nowhere to go
    if (clientIds.length === 0) {
      return <Navigate to="/" replace />
    }
    // 3b) exactly one → auto-forward
    if (clientIds.length === 1) {
      return <Navigate to={`/client/${clientIds[0]}`} replace />
    }
    // 3c) multiple → show the selector
    return <Outlet />
  }

  // 4) “id” present → only allow if it’s in their list
  if (clientIds.includes(id)) {
    return <Outlet />
  }

  // 5) Invalid “id” → back to selector or home
  if (clientIds.length > 1) {
    return <Navigate to="/client" replace />
  }
  return <Navigate to="/" replace />
}
