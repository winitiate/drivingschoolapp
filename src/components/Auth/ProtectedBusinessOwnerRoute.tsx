// src/components/Auth/ProtectedBusinessOwnerRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Box, CircularProgress } from '@mui/material'

interface Props {
  redirectPath: string
}

/**
 * Protects all /business routes.
 * - If not signed in, redirect to redirectPath.
 * - If user has no business IDs, redirect to home.
 * - If exactly one business ID, auto-redirect to /business/{id}.
 * - If multiple, allow index (BusinessSelect) and child routes.
 */
export default function ProtectedBusinessOwnerRoute({ redirectPath }: Props) {
  const { user, loading } = useAuth()
  const { businessId } = useParams<{ businessId?: string }>()

  // Wait for auth to initialize before deciding
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  // Not authenticated → sign in
  if (!user) {
    return <Navigate to={redirectPath} replace />
  }

  // Which business IDs does this user own or belong to?
  const bizIds = Array.from(
    new Set([
      ...(user.ownedBusinessIds || []),
      ...(user.memberBusinessIds || []),
    ])
  )

  // No businesses → nowhere to go
  if (bizIds.length === 0) {
    return <Navigate to="/" replace />
  }

  // No :businessId in URL → auto-forward if exactly one, else show selector
  if (!businessId) {
    if (bizIds.length === 1) {
      return <Navigate to={`/business/${bizIds[0]}`} replace />
    }
    return <Outlet />
  }

  // A businessId is present → allow only if it’s in their list
  if (bizIds.includes(businessId)) {
    return <Outlet />
  }

  // Invalid businessId → back to selector if they have many, otherwise home
  if (bizIds.length > 1) {
    return <Navigate to="/business" replace />
  }
  return <Navigate to="/" replace />
}
