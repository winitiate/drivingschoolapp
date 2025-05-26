import React from 'react'
import { Route } from 'react-router-dom'
import ProtectedServiceProviderRoute from '../components/Auth/ProtectedServiceProviderRoute'
import ServiceProviderLayout from '../layouts/ServiceProviderLayout'

import ServiceProviderSelect from '../pages/ServiceProvider/ServiceProviderSelect'
import ServiceProviderDashboard from '../pages/ServiceProvider/ServiceProviderDashboard'
import ServiceProviderAppointments from '../pages/ServiceProvider/ServiceProviderAppointments'

export const ServiceProviderRoutes = (
  <Route path="service-provider" element={<ProtectedServiceProviderRoute />}>
    <Route element={<ServiceProviderLayout />}>
      {/* /service-provider → pick which provider */}
      <Route index element={<ServiceProviderSelect />} />

      {/* /service-provider/:serviceProviderId/... */}
      <Route path=":serviceProviderId">
        {/* Dashboard */}
        <Route index element={<ServiceProviderDashboard />} />
        {/* Appointments */}
        <Route
          path="appointments"
          element={<ServiceProviderAppointments />}
        />
      </Route>
    </Route>
  </Route>
)
