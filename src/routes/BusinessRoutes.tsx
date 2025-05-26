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

export const BusinessRoutes = (
  <Route
    path="business"
    element={<ProtectedBusinessOwnerRoute redirectPath="business/sign-in" />}
  >
    <Route element={<BusinessOwnerLayout />}>
      {/* Public/auth routes */}
      <Route path="sign-in" element={<BusinessSignIn />} />
      <Route path="sign-up" element={<BusinessSignUp />} />

      {/* Selector as index */}
      <Route index element={<BusinessSelect />} />

      {/* All routes below require a valid :businessId */}
      <Route path=":businessId" element={<BusinessDashboard />} />
      <Route
        path=":businessId/service-locations"
        element={<ManageServiceLocations />}
      />
      <Route
        path=":businessId/form-templates"
        element={<BusinessFormTemplates />}
      />

      {/* NEW: Business-level settings */}
      <Route
        path=":businessId/settings"
        element={<BusinessSettingsManager />}
      />
    </Route>
  </Route>
);
