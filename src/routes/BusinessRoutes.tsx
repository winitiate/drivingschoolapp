// src/routes/BusinessRoutes.tsx
import React from 'react'
import { Route } from 'react-router-dom'

import ProtectedBusinessOwnerRoute from '../components/Auth/ProtectedBusinessOwnerRoute'
import BusinessOwnerLayout         from '../layouts/BusinessOwnerLayout'

import BusinessSignIn         from '../pages/Business/BusinessSignIn'
import BusinessSignUp         from '../pages/Business/BusinessSignUp'
import BusinessSelect         from '../pages/Business/BusinessSelect'      // <-- our selector
import BusinessDashboard      from '../pages/Business/BusinessDashboard'
import ManageServiceLocations from '../pages/Business/ManageServiceLocations'
import BusinessFormTemplates  from '../pages/Business/BusinessFormTemplates'

export const BusinessRoutes = (
  <Route
    path="business"
    element={<ProtectedBusinessOwnerRoute redirectPath="business/sign-in" />}
  >
    <Route element={<BusinessOwnerLayout />}>
      <Route path="sign-in" element={<BusinessSignIn />} />
      <Route path="sign-up" element={<BusinessSignUp />} />

      {/* INDEX now goes to your selector */}
      <Route index element={<BusinessSelect />} />

      {/* once a businessId is chosen, those dashboard routes fire */}
      <Route path=":businessId" element={<BusinessDashboard />} />
      <Route
        path=":businessId/service-locations"
        element={<ManageServiceLocations />}
      />
      <Route
        path=":businessId/form-templates"
        element={<BusinessFormTemplates />}
      />
    </Route>
  </Route>
)
