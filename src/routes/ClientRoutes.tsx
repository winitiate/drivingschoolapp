// src/routes/ClientRoutes.tsx

import React from 'react'
import { Route } from 'react-router-dom'
import ProtectedClientRoute from '../components/Auth/ProtectedClientRoute'
import ClientLayout from '../layouts/ClientLayout'
import ClientSelect from '../pages/Client/ClientSelect'
import ClientDashboard from '../pages/Client/ClientDashboard'

export const ClientRoutes = (
  <>
    <Route path="client" element={<ProtectedClientRoute />}>
      <Route element={<ClientLayout />}>
        <Route index element={<ClientSelect />} />
        <Route path=":id" element={<ClientDashboard />} />
      </Route>
    </Route>
  </>
)
