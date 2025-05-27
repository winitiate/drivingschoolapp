// src/App.tsx

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/useAuth'

import ClientHomePage   from './pages/Client/ClientHomePage'
import ClientSignIn     from './pages/Client/ClientSignIn'
import { BusinessRoutes }       from './routes/BusinessRoutes'
import { ClientRoutes }         from './routes/ClientRoutes'
import { ServiceLocationRoutes }  from './routes/ServiceLocationRoutes'
import { ServiceProviderRoutes }  from './routes/ServiceProviderRoutes'
import { SuperAdminRoutes }     from './routes/SuperAdminRoutes'

// MUI Date-Pickers Localization
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Routes>
            {/* Public client sign-in */}
            <Route path="sign-in" element={<ClientSignIn />} />

            {/* Protected & nested routes */}
            {BusinessRoutes}
            {ClientRoutes}
            {ServiceLocationRoutes}
            {ServiceProviderRoutes}
            {SuperAdminRoutes}

            {/* Public Home & Fallback */}
            <Route path="/" element={<ClientHomePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LocalizationProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
