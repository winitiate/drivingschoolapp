// src/routes/SuperAdminRoutes.tsx

import React from 'react'
import { Route } from 'react-router-dom'

import ProtectedSuperAdminRoute from '../components/Auth/ProtectedSuperAdminRoute'
import SuperAdminLayout         from '../layouts/SuperAdminLayout'

import SuperAdminSignIn        from '../pages/SuperAdmin/SuperAdminSignIn'
import SuperAdminDashboard     from '../pages/SuperAdmin/SuperAdminDashboard'
import ManageBusinesses        from '../pages/SuperAdmin/BusinessManagement/ManageBusinesses'
import SuperAdminFormTemplates from '../pages/SuperAdmin/SuperAdminFormTemplates'

export const SuperAdminRoutes = (
  <>
    {/* Public sign-in (not guarded) */}
    <Route
      path="super-admin/sign-in"
      element={<SuperAdminSignIn />}
    />

    {/* Protected super-admin pages */}
    <Route
      path="super-admin"
      element={<ProtectedSuperAdminRoute />}
    >
      <Route element={<SuperAdminLayout />}>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="businesses" element={<ManageBusinesses />} />
        <Route path="form-templates" element={<SuperAdminFormTemplates />} />
      </Route>
    </Route>
  </>
)
