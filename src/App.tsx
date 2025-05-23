// src/App.tsx

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/useAuth'

import ClientHomePage         from './pages/Client/ClientHomePage'
import { BusinessRoutes }     from './routes/BusinessRoutes'
import { ClientRoutes }       from './routes/ClientRoutes'
import { ServiceLocationRoutes }  from './routes/ServiceLocationRoutes'
import { ServiceProviderRoutes }  from './routes/ServiceProviderRoutes'
import { SuperAdminRoutes }   from './routes/SuperAdminRoutes'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {BusinessRoutes}
          {ClientRoutes}
          {ServiceLocationRoutes}
          {ServiceProviderRoutes}
          {SuperAdminRoutes}

          {/* Public Home & Fallback */}
          <Route path="/" element={<ClientHomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
