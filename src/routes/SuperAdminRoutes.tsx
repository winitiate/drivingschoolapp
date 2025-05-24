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
  <Route path="super-admin" element={<ProtectedSuperAdminRoute redirectPath="super-admin/sign-in" />}>
    <Route element={<SuperAdminLayout />}>
      {/* /super-admin/sign-in */}
      <Route path="sign-in" element={<SuperAdminSignIn />} />
      {/* /super-admin */}
      <Route index element={<SuperAdminDashboard />} />
      {/* /super-admin/businesses */}
      <Route path="businesses" element={<ManageBusinesses />} />
      {/* /super-admin/form-templates */}
      <Route path="form-templates" element={<SuperAdminFormTemplates />} />
    </Route>
  </Route>
)
