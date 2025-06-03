// src/App.tsx

import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./auth/useAuth"

import ClientSignIn             from "./pages/Client/ClientSignIn"
import { BusinessRoutes }       from "./routes/BusinessRoutes"
import { ClientRoutes }         from "./routes/ClientRoutes"
import { ServiceLocationRoutes} from "./routes/ServiceLocationRoutes"
import { ServiceProviderRoutes} from "./routes/ServiceProviderRoutes"
import { SuperAdminRoutes }     from "./routes/SuperAdminRoutes"

import Homepage      from "./pages/Homepage"
import About         from "./pages/About"
import PublicLayout  from "./layouts/PublicLayout"

// MUI Date-Pickers Localization
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs }         from "@mui/x-date-pickers/AdapterDayjs"

// MUI theme imports
import { ThemeProvider } from "@mui/material/styles"
import { lightTheme }   from "./theme/lightTheme" // named export

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
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

              {/* Public Home, About & Fallback */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <Homepage />
                  </PublicLayout>
                }
              />
              <Route
                path="/about"
                element={
                  <PublicLayout>
                    <About />
                  </PublicLayout>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LocalizationProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
