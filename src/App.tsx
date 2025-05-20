// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/useAuth';

import ClientLayout from './layouts/ClientLayout';
import ServiceLocationAdminLayout from './layouts/ServiceLocationAdminLayout';
import ServiceProviderLayout from './layouts/ServiceProviderLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import BusinessOwnerLayout from './layouts/BusinessOwnerLayout';

import ProtectedClientRoute from './components/Auth/ProtectedClientRoute';
import ProtectedServiceLocationAdminRoute from './components/Auth/ProtectedServiceLocationAdminRoute';
import ProtectedServiceProviderRoute from './components/Auth/ProtectedServiceProviderRoute';
import ProtectedSuperAdminRoute from './components/Auth/ProtectedSuperAdminRoute';
import ProtectedBusinessOwnerRoute from './components/Auth/ProtectedBusinessOwnerRoute';

// ─── Business Owner pages ────────────────────────────────────────────
import BusinessSignIn          from './pages/Business/BusinessSignIn';
import BusinessSignUp          from './pages/Business/BusinessSignUp';
import BusinessDashboard       from './pages/Business/BusinessDashboard';
import ManageServiceLocations  from './pages/Business/ManageServiceLocations';
import BusinessFormTemplates   from './pages/Business/BusinessFormTemplates';

// ─── Client pages ────────────────────────────────────────────────────
import ClientHomePage          from './pages/Client/ClientHomePage';
import ClientSignIn            from './pages/Client/ClientSignIn';
import ClientSignUp            from './pages/Client/ClientSignUp';
import ClientDashboard         from './pages/Client/ClientDashboard';
import ClientProfile           from './pages/Client/ClientProfile';
import ClientFormTemplates     from './pages/Client/ClientFormTemplates';

// ─── Service-Location Admin pages ───────────────────────────────────
import ServiceLocationSignIn        from './pages/ServiceLocation/ServiceLocationSignIn';
import ServiceLocationDashboard     from './pages/ServiceLocation/ServiceLocationDashboard';
import ClientsManager               from './pages/ServiceLocation/Clients/ClientsManager';
import ProvidersManager             from './pages/ServiceLocation/ServiceProviders/ServiceProvidersManager';
import AppointmentsManager          from './pages/ServiceLocation/Appointments/AppointmentsManager';
import AppointmentTypesManager      from './pages/ServiceLocation/Settings/AppointmentTypes/AppointmentTypesManager';
import AssessmentTypesManager       from './pages/ServiceLocation/Settings/AssessmentTypes/AssessmentTypesManager';
import GradingScalesManager         from './pages/ServiceLocation/Settings/GradingScales/GradingScalesManager';
import PackageSettings              from './pages/ServiceLocation/Settings/PackageSettings/PackageSettings';
import BusinessHoursSettings        from './pages/ServiceLocation/Settings/BusinessHours/BusinessHoursSettings';
import FAQSettings                  from './pages/ServiceLocation/Settings/FAQSettings/FAQSettings';
import SquareUpSettings             from './pages/ServiceLocation/Settings/SquareUpSettings/SquareUpSettings';
import ServiceLocationAdminSettings from './pages/ServiceLocation/Settings/ServiceLocationAdminSettings/ServiceLocationAdminSettings';
import ServiceLocationFormTemplates from './pages/ServiceLocation/Settings/FormTemplates/FormTemplatesManager';

// ─── Service-Provider pages ──────────────────────────────────────────
import ServiceProviderSignIn         from './pages/ServiceProvider/ServiceProviderSignIn';
import ServiceProviderDashboard      from './pages/ServiceProvider/ServiceProviderDashboard';
import ServiceProviderFormTemplates  from './pages/ServiceProvider/ServiceProviderFormTemplates';

// ─── Super-Admin pages ───────────────────────────────────────────────
import SuperAdminSignIn         from './pages/SuperAdmin/SuperAdminSignIn';
import SuperAdminDashboard      from './pages/SuperAdmin/SuperAdminDashboard';
import ManageBusinesses         from './pages/SuperAdmin/ManageBusinesses';
import SuperAdminFormTemplates  from './pages/SuperAdmin/SuperAdminFormTemplates';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Business Owner ───────────────────────────────────────────── */}
          <Route element={<BusinessOwnerLayout />}>
            <Route path="/business/sign-in" element={<BusinessSignIn />} />
            <Route path="/business/sign-up" element={<BusinessSignUp />} />

            <Route element={<ProtectedBusinessOwnerRoute />}>
              <Route path="/business/:businessId" element={<BusinessDashboard />} />
              <Route
                path="/business/:businessId/service-locations"
                element={<ManageServiceLocations />}
              />
              <Route
                path="/business/:businessId/form-templates"
                element={<BusinessFormTemplates />}
              />
            </Route>
          </Route>

          {/* ── Public + Client ───────────────────────────────────────────── */}
          <Route element={<ClientLayout />}>
            <Route path="/"        element={<ClientHomePage />} />
            <Route path="/sign-in" element={<ClientSignIn />} />
            <Route path="/sign-up" element={<ClientSignUp />} />

            <Route element={<ProtectedClientRoute />}>
              <Route path="/client"                element={<ClientDashboard />} />
              <Route path="/client/profile"        element={<ClientProfile />} />
              <Route path="/client/form-templates" element={<ClientFormTemplates />} />
            </Route>
          </Route>

          {/* ── Service-Location Admin ───────────────────────────────────── */}
          <Route element={<ServiceLocationAdminLayout />}>
            <Route
              path="/service-location/sign-in"
              element={<ServiceLocationSignIn />}
            />
            <Route
              element={
                <ProtectedServiceLocationAdminRoute
                  redirectPath="/service-location/sign-in"
                />
              }
            >
              <Route
                path="/service-location/:serviceLocationId"
                element={<ServiceLocationDashboard />}
              />
              <Route
                path="/service-location/:serviceLocationId/clients"
                element={<ClientsManager />}
              />
              <Route
                path="/service-location/:serviceLocationId/providers"
                element={<ProvidersManager />}
              />
              <Route
                path="/service-location/:serviceLocationId/appointments"
                element={<AppointmentsManager />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/appointment-types"
                element={<AppointmentTypesManager />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/assessment-types"
                element={<AssessmentTypesManager />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/grading-scales"
                element={<GradingScalesManager />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/package-settings"
                element={<PackageSettings />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/business-hours"
                element={<BusinessHoursSettings />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/faq-settings"
                element={<FAQSettings />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/square-up-settings"
                element={<SquareUpSettings />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/admin-settings"
                element={<ServiceLocationAdminSettings />}
              />
              <Route
                path="/service-location/:serviceLocationId/settings/form-templates"
                element={<ServiceLocationFormTemplates />}
              />
            </Route>
          </Route>

          {/* ── Service-Provider ───────────────────────────────────────────── */}
          <Route element={<ServiceProviderLayout />}>
            <Route
              path="/service-provider/sign-in"
              element={<ServiceProviderSignIn />}
            />
            <Route
              element={
                <ProtectedServiceProviderRoute
                  redirectPath="/service-provider/sign-in"
                />
              }
            >
              <Route
                path="/service-provider"
                element={<ServiceProviderDashboard />}
              />
              <Route
                path="/service-provider/form-templates"
                element={<ServiceProviderFormTemplates />}
              />
            </Route>
          </Route>

          {/* ── Super-Admin ───────────────────────────────────────────────── */}
          <Route path="/super-admin/sign-in" element={<SuperAdminSignIn />} />
          <Route
            path="/super-admin"
            element={
              <ProtectedSuperAdminRoute redirectPath="/super-admin/sign-in" />
            }
          >
            <Route element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route
                path="businesses"
                element={<ManageBusinesses />}
              />
              <Route
                path="form-templates"
                element={<SuperAdminFormTemplates />}
              />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
