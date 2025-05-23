// src/components/Auth/ProtectedBusinessOwnerRoute.tsx

import React from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

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
const ProtectedBusinessOwnerRoute: React.FC<Props> = ({ redirectPath }) => {
  const { user, loading } = useAuth()
  const { businessId } = useParams<{ businessId?: string }>()

  if (loading) return null  // or a spinner

  if (!user) {
    // not authenticated
    return <Navigate to={redirectPath} replace />
  }

  const bizIds = Array.from(
    new Set([...(user.ownedBusinessIds || []), ...(user.memberBusinessIds || [])])
  )

  if (bizIds.length === 0) {
    // no business → nowhere to go
    return <Navigate to="/" replace />
  }

  if (!businessId) {
    // landing on /business without an ID
    if (bizIds.length === 1) {
      // exactly one → go straight there
      return <Navigate to={`/business/${bizIds[0]}`} replace />
    }
    // multiple → render index (BusinessSelect)
    return <Outlet />
  }

  // if a businessId param is present but not in their allowed list, bail to selector
  if (!bizIds.includes(businessId)) {
    return <Navigate to="/business" replace />
  }

  // otherwise render child routes (dashboard, etc.)
  return <Outlet />
}

export default ProtectedBusinessOwnerRoute
