// src/routes/ServiceLocationRoutes.tsx

import React from 'react'
import { Route } from 'react-router-dom'
import ProtectedServiceLocationAdminRoute from '../components/Auth/ProtectedServiceLocationAdminRoute'
import ServiceLocationAdminLayout from '../layouts/ServiceLocationAdminLayout'
import ServiceLocationSelect from '../pages/ServiceLocation/ServiceLocationSelect'
import ServiceLocationDashboard from '../pages/ServiceLocation/ServiceLocationDashboard'
import ClientsManager from '../pages/ServiceLocation/Clients/ClientsManager'
import ProvidersManager from '../pages/ServiceLocation/ServiceProviders/ServiceProvidersManager'

export const ServiceLocationRoutes = (
  <Route
    path="service-location"
    element={<ProtectedServiceLocationAdminRoute />}
  >
    <Route element={<ServiceLocationAdminLayout />}>
      {/* /service-location → selector or auto-forward */}
      <Route index element={<ServiceLocationSelect />} />
      {/* /service-location/:serviceLocationId → dashboard, clients, providers */}
      <Route path=":serviceLocationId">
        <Route index element={<ServiceLocationDashboard />} />
        <Route path="clients" element={<ClientsManager />} />
        <Route path="providers" element={<ProvidersManager />} />
      </Route>
    </Route>
  </Route>
)
