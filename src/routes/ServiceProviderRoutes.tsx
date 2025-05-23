// src/routes/ServiceProviderRoutes.tsx

import React from 'react'
import { Route } from 'react-router-dom'
import ProtectedServiceProviderRoute from '../components/Auth/ProtectedServiceProviderRoute'
import ServiceProviderLayout from '../layouts/ServiceProviderLayout'
import ServiceProviderSelect from '../pages/ServiceProvider/ServiceProviderSelect'
import ServiceProviderDashboard from '../pages/ServiceProvider/ServiceProviderDashboard'

export const ServiceProviderRoutes = (
  <>
    <Route
      path="service-provider"
      element={<ProtectedServiceProviderRoute />}
    >
      <Route element={<ServiceProviderLayout />}>
        <Route index element={<ServiceProviderSelect />} />
        <Route path=":id" element={<ServiceProviderDashboard />} />
      </Route>
    </Route>
  </>
)
