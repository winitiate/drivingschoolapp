// src/routes/ServiceLocationRoutes.tsx

import React from 'react';
import { Route } from 'react-router-dom';

import ProtectedServiceLocationAdminRoute from '../components/Auth/ProtectedServiceLocationAdminRoute';
import ServiceLocationAdminLayout         from '../layouts/ServiceLocationAdminLayout';

import ServiceLocationSelect   from '../pages/ServiceLocation/ServiceLocationSelect';
import ServiceLocationDashboard from '../pages/ServiceLocation/ServiceLocationDashboard';
import ClientsManager          from '../pages/ServiceLocation/Clients/ClientsManager';
import ProvidersManager        from '../pages/ServiceLocation/ServiceProviders/ServiceProvidersManager';
import AppointmentsManager     from '../pages/ServiceLocation/Appointments/AppointmentsManager';

// Settings pages (note correct paths)
import LocationSettingsManager     from '../pages/ServiceLocation/LocationSettingsManager';
import AppointmentTypesManager     from '../pages/ServiceLocation/Settings/AppointmentTypes/AppointmentTypesManager';
import AssessmentTypesManager      from '../pages/ServiceLocation/Settings/AssessmentTypes/AssessmentTypesManager';
import GradingScalesManager        from '../pages/ServiceLocation/Settings/GradingScales/GradingScalesManager';
import PackageSettings             from '../pages/ServiceLocation/Settings/PackageSettings/PackageSettings';
import BusinessHoursSettings       from '../pages/ServiceLocation/Settings/BusinessHours/BusinessHoursSettings';
import FAQSettings                 from '../pages/ServiceLocation/Settings/FAQSettings/FaqSettings';
import FormTemplatesManager        from '../pages/ServiceLocation/Settings/FormTemplates/FormTemplatesManager';
import ServiceLocationAdminSettings from '../pages/ServiceLocation/Settings/ServiceLocationAdminSettings/ServiceLocationAdminSettings';
import SquareUpSettings            from '../pages/ServiceLocation/Settings/SquareUpSettings/SquareUpSettings';

// Availability editor
import ServiceLocationAvailabilityPage from '../pages/ServiceLocation/AvailabilityPage';

export const ServiceLocationRoutes = (
  <Route
    path="service-location"
    element={<ProtectedServiceLocationAdminRoute />}
  >
    <Route element={<ServiceLocationAdminLayout />}>
      {/* /service-location → selector */}
      <Route index element={<ServiceLocationSelect />} />

      {/* /service-location/:serviceLocationId/... */}
      <Route path=":serviceLocationId">
        <Route index element={<ServiceLocationDashboard />} />
        <Route path="clients"     element={<ClientsManager />} />
        <Route path="providers"   element={<ProvidersManager />} />
        <Route path="appointments" element={<AppointmentsManager />} />

        {/* /service-location/:serviceLocationId/settings/... */}
        <Route path="settings">
          <Route index element={<LocationSettingsManager />} />
          <Route
            path="appointment-types"
            element={<AppointmentTypesManager />}
          />
          <Route
            path="assessment-types"
            element={<AssessmentTypesManager />}
          />
          <Route
            path="grading-scales"
            element={<GradingScalesManager />}
          />
          <Route
            path="package-settings"
            element={<PackageSettings />}
          />
          <Route
            path="business-hours"
            element={<BusinessHoursSettings />}
          />
          <Route path="faq-settings" element={<FAQSettings />} />
          <Route
            path="form-templates"
            element={<FormTemplatesManager />}
          />
          <Route
            path="service-location-admin-settings"
            element={<ServiceLocationAdminSettings />}
          />
          <Route
            path="square-up-settings"
            element={<SquareUpSettings />}
          />

          {/* availability */}
          <Route
            path="availability"
            element={<ServiceLocationAvailabilityPage />}
          />
        </Route>
      </Route>
    </Route>
  </Route>
);
