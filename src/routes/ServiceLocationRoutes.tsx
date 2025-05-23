// src/routes/ServiceLocationRoutes.tsx

import React from 'react'
import { Route, Outlet } from 'react-router-dom'
import ProtectedServiceLocationAdminRoute from '../components/Auth/ProtectedServiceLocationAdminRoute'
import ServiceLocationAdminLayout from '../layouts/ServiceLocationAdminLayout'
import ServiceLocationSelect from '../pages/ServiceLocation/ServiceLocationSelect'
import ServiceLocationDashboard from '../pages/ServiceLocation/ServiceLocationDashboard'
import ServiceLocationClients from '../pages/ServiceLocation/Clients/ClientsManager'
import ServiceLocationProviders from '../pages/ServiceLocation/ServiceProviders/ServiceProvidersManager'

export const ServiceLocationRoutes = (
  <>
    <Route
      path="service-location"
      element={<ProtectedServiceLocationAdminRoute />}
    >
      <Route element={<ServiceLocationAdminLayout />}>
        {/* /service-location → selector page */}
        <Route index element={<ServiceLocationSelect />} />

        {/* Group all /service-location/:serviceLocationId/* under an <Outlet> */}
        <Route path=":serviceLocationId" element={<Outlet />}>
          {/* /service-location/:serviceLocationId → dashboard */}
          <Route index element={<ServiceLocationDashboard />} />
          {/* /service-location/:serviceLocationId/clients */}
          <Route path="clients" element={<ServiceLocationClients />} />
          {/* /service-location/:serviceLocationId/providers */}
          <Route path="providers" element={<ServiceLocationProviders />} />
        </Route>
      </Route>
    </Route>
  </>
)
