// src/App.tsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/useAuth";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs }         from "@mui/x-date-pickers/AdapterDayjs";

import { ThemeProvider } from "@mui/material/styles";
import { lightTheme }   from "./theme/lightTheme";

import { PublicRoutes }         from "./routes/PublicRoutes";
import { BusinessRoutes }       from "./routes/BusinessRoutes";
import { ClientRoutes }         from "./routes/ClientRoutes";
import { ServiceLocationRoutes} from "./routes/ServiceLocationRoutes";
import { ServiceProviderRoutes} from "./routes/ServiceProviderRoutes";
import { SuperAdminRoutes }     from "./routes/SuperAdminRoutes";

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <AuthProvider>
        <BrowserRouter>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Routes>
              {/* all truly public pages */}
              {PublicRoutes}

              {/* all protected, nested route groups */}
              {BusinessRoutes}
              {ClientRoutes}
              {ServiceLocationRoutes}
              {ServiceProviderRoutes}
              {SuperAdminRoutes}

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LocalizationProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
