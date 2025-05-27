// src/routes/BusinessRoutes.tsx

import React from 'react';
import { Route } from 'react-router-dom';

import ProtectedBusinessOwnerRoute from '../components/Auth/ProtectedBusinessOwnerRoute';
import BusinessOwnerLayout         from '../layouts/BusinessOwnerLayout';

import BusinessSignIn              from '../pages/Business/BusinessSignIn';
import BusinessSignUp              from '../pages/Business/BusinessSignUp';
import BusinessSelect              from '../pages/Business/BusinessSelect';
import BusinessDashboard           from '../pages/Business/BusinessDashboard';
import ManageServiceLocations      from '../pages/Business/ManageServiceLocations';
import BusinessFormTemplates       from '../pages/Business/BusinessFormTemplates';
import BusinessSettingsManager     from '../pages/Business/Settings/BusinessSettingsManager';
import BusinessAvailabilityPage    from '../pages/Business/Settings/BusinessAvailabilityPage';

export const BusinessRoutes = (
  <Route
    path="business"
    element={<ProtectedBusinessOwnerRoute redirectPath="business/sign-in" />}
  >
    <Route element={<BusinessOwnerLayout />}>
      {/* auth */}
      <Route path="sign-in" element={<BusinessSignIn />} />
      <Route path="sign-up" element={<BusinessSignUp />} />

      {/* selector */}
      <Route index element={<BusinessSelect />} />

      {/* scoped to :businessId */}
      <Route path=":businessId">
        {/* dashboard */}
        <Route index element={<BusinessDashboard />} />

        {/* other business routes */}
        <Route
          path="service-locations"
          element={<ManageServiceLocations />}
        />
        <Route
          path="form-templates"
          element={<BusinessFormTemplates />}
        />

        {/* settings */}
        <Route path="settings">
          <Route index element={<BusinessSettingsManager />} />
          <Route
            path="availability"
            element={<BusinessAvailabilityPage />}
          />
        </Route>
      </Route>
    </Route>
  </Route>
);
